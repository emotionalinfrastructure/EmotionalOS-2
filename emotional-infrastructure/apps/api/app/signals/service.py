from __future__ import annotations

from sqlalchemy.orm import Session

from app.config import settings
from app.ledger import service as ledger_service
from app.models import EGLSignalEvent
from app.signals.rules import TAXONOMY, TAXONOMY_BY_CODE, magnitude_to_tier
from app.signals.schemas import SignalEvaluateRequest, SignalEvaluateResponse, TaxonomyEntry, TaxonomyResponse


def get_taxonomy() -> TaxonomyResponse:
    return TaxonomyResponse(entries=[TaxonomyEntry(**entry) for entry in TAXONOMY])


def evaluate_signal(db: Session, req: SignalEvaluateRequest) -> SignalEvaluateResponse:
    entry = TAXONOMY_BY_CODE[req.code]
    tier = magnitude_to_tier(req.value)
    rationale = f"{entry['name']} magnitude {req.value:.2f} mapped to governance risk tier {tier}."

    ledger_event = ledger_service.append_event(
        db,
        decision="allow" if tier < 2 else "review_required",
        policy_version=settings.policy_uri_default,
        sub=req.sub,
        signal_category=req.code,
        pdev_action="signals_evaluate",
        event_metadata={"code": req.code, "value": req.value, "tier": tier},
    )

    db.add(
        EGLSignalEvent(
            sub=req.sub,
            event_type="signals_evaluate",
            tier=tier,
            tier_label=entry["family"],
            signal_codes=[req.code],
            features={req.code: req.value},
            ledger_event_id=ledger_event.event_id,
        )
    )
    db.commit()

    return SignalEvaluateResponse(
        code=req.code,
        family=entry["family"],
        governance_risk_tier=tier,
        rationale=rationale,
        ledger_event_id=ledger_event.event_id,
    )
