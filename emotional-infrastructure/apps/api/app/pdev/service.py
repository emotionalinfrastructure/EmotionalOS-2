"""PDEV middleware: Purpose, Dignity, Evidence, Veto gate evaluation.

Every gate is a real, deterministic check against the submitted request,
the presented CTP token (if any), and stored revocation state -- there is
no static/mocked branch here.
"""
from __future__ import annotations

from app.config import settings
from app.governance_constants import (
    APPROVED_PURPOSES,
    IRREVERSIBLE_OR_HIGH_RISK,
    PURPOSE_FEATURE_ALLOWLIST,
)
from app.ledger import service as ledger_service
from app.models import ConsentTokenRecord, PDEVDecision, RevokedToken
from app.pdev.schemas import PDEVEvaluateRequest, PDEVEvaluateResponse
from app.security.hashing import context_hash as compute_context_hash
from app.security.jwt_service import TokenExpiredError, TokenInvalidError, TokenMalformedError, decode_and_verify
from sqlalchemy.orm import Session


def _is_revoked(db: Session, jti: str) -> bool:
    if db.get(RevokedToken, jti) is not None:
        return True
    record = db.get(ConsentTokenRecord, jti)
    return bool(record and record.revoked)


def evaluate(db: Session, req: PDEVEvaluateRequest) -> PDEVEvaluateResponse:
    reasons: list[str] = []
    policy_version = req.policy_version or settings.policy_uri_default

    # --- decode token once, used by both Evidence and Veto gates ---
    token_claims = None
    token_error: str | None = None
    if req.token:
        try:
            token_claims = decode_and_verify(req.token)
        except TokenExpiredError:
            token_error = "consent_token_expired"
        except (TokenInvalidError, TokenMalformedError):
            token_error = "consent_token_invalid"

    # --- Purpose gate ---
    purpose_ok = True
    if not req.purpose:
        purpose_ok = False
        reasons.append("purpose_missing")
    elif req.purpose not in APPROVED_PURPOSES:
        purpose_ok = False
        reasons.append("purpose_not_approved")
    if token_claims is not None and token_claims.get("purpose") != req.purpose:
        purpose_ok = False
        reasons.append("purpose_mismatch_with_consent_token")
    allowed_features = PURPOSE_FEATURE_ALLOWLIST.get(req.purpose, set())
    if req.requested_feature not in allowed_features:
        purpose_ok = False
        reasons.append("requested_feature_not_narrow_for_purpose")

    # --- Dignity gate ---
    dignity_ok = True
    if req.signal_tier == 3:
        dignity_ok = False
        reasons.append("manipulation_vector_active_tier3")
    if req.hidden_steering:
        dignity_ok = False
        reasons.append("hidden_adaptive_steering_detected")
    vulnerable_state = req.signal_tier == 2
    step_up_required = vulnerable_state and req.action_risk in IRREVERSIBLE_OR_HIGH_RISK
    if step_up_required and not req.step_up_confirmed:
        dignity_ok = False
        reasons.append("irreversible_action_during_vulnerable_state_without_step_up")

    # --- Evidence gate ---
    evidence_ok = True
    context_hash_val: str | None = None
    if req.token is None:
        evidence_ok = False
        reasons.append("no_consent_token_presented")
    elif token_error is not None:
        evidence_ok = False
        reasons.append(token_error)
    else:
        assert token_claims is not None
        if req.context is not None:
            context_hash_val = compute_context_hash(req.context.model_dump())
            if context_hash_val != token_claims.get("context_hash"):
                evidence_ok = False
                reasons.append("context_hash_mismatch")
        else:
            context_hash_val = token_claims.get("context_hash")
        if _is_revoked(db, token_claims["jti"]):
            evidence_ok = False
            reasons.append("consent_token_revoked")

    # --- Veto gate ---
    veto_ok = True
    revoked = token_claims is not None and _is_revoked(db, token_claims["jti"])
    if req.veto_requested:
        veto_ok = False
        reasons.append("veto_requested")
    if revoked:
        veto_ok = False
        reasons.append("consent_revoked_veto_active")

    # --- Combine into a single decision ---
    if not veto_ok:
        decision = "vetoed"
    elif not evidence_ok or not purpose_ok:
        decision = "deny"
    elif not dignity_ok:
        decision = "deny" if (req.signal_tier == 3 or req.hidden_steering) else "review_required"
    else:
        decision = "allow"

    sub = req.sub
    jti = token_claims.get("jti") if token_claims else None

    ledger_event = ledger_service.append_event(
        db,
        decision=decision,
        policy_version=policy_version,
        jti=jti,
        sub=sub,
        signal_category=f"tier_{req.signal_tier}",
        pdev_action="pdev_evaluate",
        context_hash=context_hash_val,
        event_metadata={"reasons": reasons, "requested_feature": req.requested_feature},
    )

    row = PDEVDecision(
        sub=sub,
        jti=jti,
        purpose=req.purpose,
        requested_feature=req.requested_feature,
        decision=decision,
        purpose_gate="pass" if purpose_ok else "fail",
        dignity_gate="pass" if dignity_ok else "fail",
        evidence_gate="pass" if evidence_ok else "fail",
        veto_gate="pass" if veto_ok else "fail",
        reasons=reasons,
        ledger_event_id=ledger_event.event_id,
    )
    db.add(row)
    db.commit()

    return PDEVEvaluateResponse(
        decision=decision,
        purpose="pass" if purpose_ok else "fail",
        dignity="pass" if dignity_ok else "fail",
        evidence="pass" if evidence_ok else "fail",
        veto="pass" if veto_ok else "fail",
        reasons=reasons,
        ledger_event_id=ledger_event.event_id,
    )
