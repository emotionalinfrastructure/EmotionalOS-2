"""TAR: Temporal Affective Regulation.

Core principle enforced here: an inference reference existing is never
itself authorization to act. Acting requires a live, unexpired
TARAuthorization row, and any risk escalation beyond what was authorized
requires either a fresh authorization (reauthorization_required) or an
explicit, pre-approved escalation path.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.config import settings
from app.ledger import service as ledger_service
from app.models import TARAuthorization
from app.tar.schemas import (
    AuthorizationOut,
    AuthorizeRequest,
    EvaluateRequest,
    EvaluateResponse,
    ExpireRequest,
    ExpireResponse,
)

RISK_RANK = {"low": 0, "medium": 1, "high": 2, "irreversible": 3}


def authorize(db: Session, req: AuthorizeRequest) -> AuthorizationOut:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(seconds=req.ttl_seconds)

    ledger_event = ledger_service.append_event(
        db,
        decision="allow",
        policy_version=settings.policy_uri_default,
        sub=req.sub,
        inference_label=req.inference_ref,
        pdev_action="tar_authorize",
        event_metadata={"authorized_action": req.authorized_action, "action_risk": req.action_risk},
    )

    row = TARAuthorization(
        sub=req.sub,
        inference_ref=req.inference_ref,
        inference_recorded_at=now,
        authorized_action=req.authorized_action,
        action_risk=req.action_risk,
        escalation_allowed=req.escalation_allowed,
        status="active",
        authorized_at=now,
        expires_at=expires_at,
        ledger_event_id=ledger_event.event_id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return AuthorizationOut.model_validate(row)


def get_authorization(db: Session, authorization_id: str) -> TARAuthorization | None:
    return db.get(TARAuthorization, authorization_id)


def evaluate(db: Session, req: EvaluateRequest) -> EvaluateResponse:
    row = db.get(TARAuthorization, req.authorization_id)
    reasons: list[str] = []

    if row is None:
        event = ledger_service.append_event(
            db,
            decision="deny",
            policy_version=settings.policy_uri_default,
            pdev_action="tar_evaluate",
            event_metadata={"reason": "authorization_not_found", "authorization_id": req.authorization_id},
        )
        return EvaluateResponse(
            decision="deny",
            valid_now=False,
            expires_at=None,
            escalation_allowed=False,
            reauthorization_required=True,
            reasons=["authorization_not_found"],
            ledger_event_id=event.event_id,
        )

    now = datetime.now(timezone.utc)
    is_expired = now > row.expires_at or row.status != "active"
    valid_now = not is_expired

    if is_expired:
        decision = "expired"
        reauthorization_required = True
        reasons.append("authorization_window_has_elapsed_or_authorization_inactive")
    else:
        requested_rank = RISK_RANK[req.requested_action_risk]
        authorized_rank = RISK_RANK[row.action_risk]
        if requested_rank > authorized_rank:
            if req.requested_escalation and row.escalation_allowed:
                decision = "review_required"
                reauthorization_required = False
                reasons.append("escalation_requested_within_allowed_scope_requires_human_review")
            else:
                decision = "reauthorization_required"
                reauthorization_required = True
                reasons.append("requested_action_risk_exceeds_authorized_scope")
        else:
            decision = "allow"
            reauthorization_required = False
            reasons.append("requested_action_is_within_authorized_scope_and_window")

    event = ledger_service.append_event(
        db,
        decision=decision,
        policy_version=settings.policy_uri_default,
        sub=row.sub,
        inference_label=row.inference_ref,
        pdev_action="tar_evaluate",
        event_metadata={"reasons": reasons, "requested_action_risk": req.requested_action_risk},
    )

    return EvaluateResponse(
        decision=decision,
        valid_now=valid_now,
        expires_at=row.expires_at,
        escalation_allowed=row.escalation_allowed,
        reauthorization_required=reauthorization_required,
        reasons=reasons,
        ledger_event_id=event.event_id,
    )


def expire(db: Session, req: ExpireRequest) -> ExpireResponse:
    row = db.get(TARAuthorization, req.authorization_id)
    if row is None:
        return ExpireResponse(id=req.authorization_id, status="not_found", ledger_event_id=None)

    row.status = "expired"
    db.commit()

    event = ledger_service.append_event(
        db,
        decision="expired",
        policy_version=settings.policy_uri_default,
        sub=row.sub,
        inference_label=row.inference_ref,
        pdev_action="tar_expire",
        event_metadata={"reason": req.reason},
    )
    return ExpireResponse(id=row.id, status="expired", ledger_event_id=event.event_id)
