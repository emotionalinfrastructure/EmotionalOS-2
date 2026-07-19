"""CTP (Consent Token Protocol) service logic.

Implements the real issue / validate / revoke / introspect / crl / process
flows described in the implementation spec section 7. Every allow and deny
decision writes a Dignity Ledger event in the same call.
"""
from __future__ import annotations

import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.ctp.schemas import (
    CRLEntry,
    IntrospectResponse,
    IssueRequest,
    IssueResponse,
    ProcessRequest,
    ProcessResponse,
    RevokeResponse,
    ValidateRequest,
    ValidateResponse,
)
from app.ledger import service as ledger_service
from app.models import ConsentTokenRecord, RevokedToken
from app.security.hashing import context_hash as compute_context_hash
from app.security.hashing import sha256_hex
from app.security.jwt_service import (
    TokenExpiredError,
    TokenInvalidError,
    TokenMalformedError,
    decode_and_verify,
    decode_unverified,
    sign_claims,
)


def _is_revoked(db: Session, jti: str) -> bool:
    if db.get(RevokedToken, jti) is not None:
        return True
    record = db.get(ConsentTokenRecord, jti)
    return bool(record and record.revoked)


def issue(db: Session, req: IssueRequest) -> IssueResponse:
    now = datetime.now(timezone.utc)
    ttl = min(req.ttl_seconds or settings.max_token_ttl_seconds, settings.max_token_ttl_seconds)
    expires_at = now + timedelta(seconds=ttl)
    jti = str(uuid.uuid4())
    envelope = req.context.model_dump()
    c_hash = compute_context_hash(envelope)

    claims: dict[str, Any] = {
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "sub": req.sub,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
        "jti": jti,
        "scope": req.scope,
        "purpose": req.purpose,
        "context_hash": c_hash,
        "policy_uri": settings.policy_uri_default,
        "consent_level": req.consent_level,
        "consent_version": settings.consent_version,
    }
    token = sign_claims(claims)

    db.add(
        ConsentTokenRecord(
            jti=jti,
            sub=req.sub,
            aud=settings.jwt_audience,
            iss=settings.jwt_issuer,
            scope=req.scope,
            purpose=req.purpose,
            context_hash=c_hash,
            context_envelope=envelope,
            policy_uri=settings.policy_uri_default,
            consent_level=req.consent_level,
            consent_version=settings.consent_version,
            issued_at=now,
            expires_at=expires_at,
        )
    )
    db.commit()

    ledger_event = ledger_service.append_event(
        db,
        decision="allow",
        policy_version=settings.policy_uri_default,
        jti=jti,
        sub=req.sub,
        pdev_action="ctp_issue",
        context_hash=c_hash,
        event_metadata={"scope": req.scope, "purpose": req.purpose},
    )

    return IssueResponse(
        token=token,
        jti=jti,
        sub=req.sub,
        scope=req.scope,
        purpose=req.purpose,
        context_hash=c_hash,
        policy_uri=settings.policy_uri_default,
        consent_level=req.consent_level,
        consent_version=settings.consent_version,
        issued_at=now,
        expires_at=expires_at,
        ledger_event_id=ledger_event.event_id,
    )


def _deny(
    db: Session,
    *,
    reason: str,
    jti: str | None,
    sub: str | None,
    context_hash_val: str | None,
) -> ValidateResponse:
    event = ledger_service.append_event(
        db,
        decision="deny",
        policy_version=settings.policy_uri_default,
        jti=jti,
        sub=sub,
        pdev_action="ctp_validate",
        context_hash=context_hash_val,
        event_metadata={"reason": reason},
    )
    return ValidateResponse(decision="deny", reason=reason, ledger_event_id=event.event_id)


def validate(db: Session, req: ValidateRequest) -> tuple[int, ValidateResponse]:
    try:
        claims = decode_and_verify(req.token)
    except TokenExpiredError:
        unverified = decode_unverified(req.token) or {}
        return 401, _deny(
            db, reason="expired", jti=unverified.get("jti"), sub=unverified.get("sub"), context_hash_val=None
        )
    except TokenMalformedError:
        return 401, _deny(db, reason="malformed", jti=None, sub=None, context_hash_val=None)
    except TokenInvalidError:
        unverified = decode_unverified(req.token) or {}
        return 401, _deny(
            db, reason="invalid", jti=unverified.get("jti"), sub=unverified.get("sub"), context_hash_val=None
        )

    jti = claims["jti"]
    sub = claims["sub"]

    if claims.get("consent_version") != settings.consent_version:
        return 401, _deny(db, reason="invalid_consent_version", jti=jti, sub=sub, context_hash_val=None)

    if _is_revoked(db, jti):
        return 401, _deny(db, reason="revoked", jti=jti, sub=sub, context_hash_val=claims.get("context_hash"))

    submitted_hash = compute_context_hash(req.context.model_dump())
    if submitted_hash != claims.get("context_hash"):
        event = ledger_service.append_event(
            db,
            decision="deny",
            policy_version=settings.policy_uri_default,
            jti=jti,
            sub=sub,
            pdev_action="ctp_validate",
            context_hash=submitted_hash,
            event_metadata={"reason": "context_mismatch", "expected": claims.get("context_hash")},
        )
        return 400, ValidateResponse(decision="deny", reason="context_mismatch", ledger_event_id=event.event_id)

    if req.expected_scope and req.expected_scope != claims.get("scope"):
        return 403, _deny(db, reason="scope_mismatch", jti=jti, sub=sub, context_hash_val=submitted_hash)

    if req.expected_purpose and req.expected_purpose != claims.get("purpose"):
        return 403, _deny(db, reason="purpose_mismatch", jti=jti, sub=sub, context_hash_val=submitted_hash)

    event = ledger_service.append_event(
        db,
        decision="allow",
        policy_version=settings.policy_uri_default,
        jti=jti,
        sub=sub,
        pdev_action="ctp_validate",
        context_hash=submitted_hash,
    )
    return 200, ValidateResponse(decision="allow", reason="ok", claims=claims, ledger_event_id=event.event_id)


def revoke(db: Session, jti: str, reason: str) -> tuple[int, RevokeResponse]:
    record = db.get(ConsentTokenRecord, jti)
    if record is None:
        return 404, RevokeResponse(jti=jti, revoked=False, ledger_event_id=None)

    record.revoked = True
    record.revoked_at = datetime.now(timezone.utc)
    record.revocation_reason = reason
    if db.get(RevokedToken, jti) is None:
        db.add(RevokedToken(jti=jti, reason=reason))
    db.commit()

    event = ledger_service.append_event(
        db,
        decision="revoked",
        policy_version=settings.policy_uri_default,
        jti=jti,
        sub=record.sub,
        pdev_action="ctp_revoke",
        event_metadata={"reason": reason},
    )
    return 200, RevokeResponse(jti=jti, revoked=True, ledger_event_id=event.event_id)


def introspect(db: Session, token: str) -> IntrospectResponse:
    try:
        claims = decode_and_verify(token)
        jti = claims["jti"]
        revoked = _is_revoked(db, jti)
        return IntrospectResponse(active=not revoked, expired=False, revoked=revoked, claims=claims)
    except TokenExpiredError:
        unverified = decode_unverified(token)
        jti = (unverified or {}).get("jti")
        revoked = _is_revoked(db, jti) if jti else False
        return IntrospectResponse(active=False, expired=True, revoked=revoked, claims=unverified)
    except (TokenInvalidError, TokenMalformedError):
        return IntrospectResponse(active=False, expired=False, revoked=False, claims=decode_unverified(token))


def crl(db: Session) -> list[CRLEntry]:
    rows = db.execute(select(RevokedToken).order_by(RevokedToken.revoked_at.desc())).scalars().all()
    return [CRLEntry(jti=r.jti, revoked_at=r.revoked_at, reason=r.reason) for r in rows]


def process(db: Session, req: ProcessRequest) -> tuple[int, ProcessResponse]:
    from app.ctp.schemas import ValidateRequest as _ValidateRequest

    status_code, validation = validate(
        db,
        _ValidateRequest(
            token=req.token,
            context=req.context,
            expected_scope=req.scope,
            expected_purpose=req.purpose,
        ),
    )

    if validation.decision != "allow":
        return status_code, ProcessResponse(
            decision="deny", reason=validation.reason, ledger_event_id=validation.ledger_event_id
        )

    claims = validation.claims or {}
    jti = claims.get("jti")
    sub = claims.get("sub")
    processed_at = datetime.now(timezone.utc)
    process_id = sha256_hex(f"{jti}:{processed_at.isoformat()}:{time.perf_counter_ns()}")
    operation = req.payload_descriptor.get("operation", "generic_processing")

    result = {
        "accepted": True,
        "operation": operation,
        "scope": claims.get("scope"),
        "purpose": claims.get("purpose"),
    }

    event = ledger_service.append_event(
        db,
        decision="allow",
        policy_version=settings.policy_uri_default,
        jti=jti,
        sub=sub,
        pdev_action="ctp_process",
        context_hash=claims.get("context_hash"),
        event_metadata={"operation": operation, "process_id": process_id},
    )

    return 200, ProcessResponse(
        decision="allow",
        reason="ok",
        process_id=process_id,
        processed_at=processed_at,
        result=result,
        ledger_event_id=event.event_id,
    )
