"""EGL: Emotional Governance Layer -- signal-tier classification, the
dynamic circuit breaker, and consent step-up for high-risk actions taken
under vulnerability markers.
"""
from __future__ import annotations

from app.config import settings
from app.egl.schemas import (
    CircuitBreakerRequest,
    CircuitBreakerResponse,
    ClassifySignalRequest,
    ClassifySignalResponse,
    ConsentStepUpRequest,
    ConsentStepUpResponse,
)
from app.governance_constants import IRREVERSIBLE_OR_HIGH_RISK
from app.ledger import service as ledger_service
from app.models import EGLSignalEvent
from sqlalchemy.orm import Session

TIER_LABELS = {
    0: "basal_state",
    1: "operational_stress",
    2: "vulnerability_markers",
    3: "manipulation_vectors",
}

TIER3_THRESHOLD = 0.5
TIER2_THRESHOLD = 0.5
TIER1_THRESHOLD = 0.4


def classify_signal(db: Session, req: ClassifySignalRequest) -> ClassifySignalResponse:
    f = req.features
    signal_codes: list[str] = []

    tier3_hits = {
        "profiling_vector_score": f.profiling_vector_score,
        "attachment_building_score": f.attachment_building_score,
        "insecurity_exploitation_score": f.insecurity_exploitation_score,
    }
    tier2_hits = {
        "exhaustion_score": f.exhaustion_score,
        "confusion_score": f.confusion_score,
        "epistemic_surrender_score": f.epistemic_surrender_score,
    }
    tier1_hits = {
        "urgency_score": f.urgency_score,
        "repetition_score": f.repetition_score,
        "pacing_score": f.pacing_score,
    }

    tier3_triggered = [k for k, v in tier3_hits.items() if v >= TIER3_THRESHOLD]
    tier2_triggered = [k for k, v in tier2_hits.items() if v >= TIER2_THRESHOLD]
    tier1_triggered = [k for k, v in tier1_hits.items() if v >= TIER1_THRESHOLD]

    if tier3_triggered:
        tier = 3
        signal_codes = tier3_triggered
    elif tier2_triggered:
        tier = 2
        signal_codes = tier2_triggered
    elif tier1_triggered:
        tier = 1
        signal_codes = tier1_triggered
    else:
        tier = 0
        signal_codes = []

    tier_label = TIER_LABELS[tier]
    decision = "deny" if tier == 3 else "allow"

    ledger_event = ledger_service.append_event(
        db,
        decision=decision,
        policy_version=settings.policy_uri_default,
        sub=req.sub,
        signal_category=tier_label,
        pdev_action="egl_classify_signal",
        event_metadata={"signal_codes": signal_codes, "tier": tier},
    )

    db.add(
        EGLSignalEvent(
            sub=req.sub,
            event_type="classify",
            tier=tier,
            tier_label=tier_label,
            signal_codes=signal_codes,
            features=f.model_dump(),
            ledger_event_id=ledger_event.event_id,
        )
    )
    db.commit()

    return ClassifySignalResponse(
        tier=tier,
        tier_label=tier_label,
        signal_codes=signal_codes,
        decision=decision,
        ledger_event_id=ledger_event.event_id,
    )


def evaluate_circuit_breaker(db: Session, req: CircuitBreakerRequest) -> CircuitBreakerResponse:
    reasons: list[str] = []
    vulnerable = req.emotional_state == "distress_vulnerable"

    if vulnerable and req.action_risk == "irreversible":
        action = "hard_block"
        reasons.append("distress_vulnerable_state_with_irreversible_action")
    elif vulnerable and req.action_risk == "high":
        action = "require_consent_step_up"
        reasons.append("distress_vulnerable_state_with_high_risk_action")
    elif vulnerable and req.cognitive_load == "high":
        action = "require_human_check_in"
        reasons.append("distress_vulnerable_state_with_high_cognitive_load")
    elif vulnerable:
        action = "simplify_ui"
        reasons.append("distress_vulnerable_state")
    elif req.cognitive_load == "high" and req.action_risk in IRREVERSIBLE_OR_HIGH_RISK:
        action = "require_human_check_in"
        reasons.append("high_cognitive_load_with_high_risk_action")
    elif req.cognitive_load == "high":
        action = "pause_nonessential_streams"
        reasons.append("high_cognitive_load")
    elif req.emotional_state == "unknown" and req.action_risk == "irreversible":
        action = "require_consent_step_up"
        reasons.append("unknown_emotional_state_with_irreversible_action")
    else:
        action = "sustain"
        reasons.append("no_intervention_conditions_met")

    decision = "deny" if action == "hard_block" else "review_required" if action in (
        "require_human_check_in",
        "require_consent_step_up",
    ) else "allow"

    ledger_event = ledger_service.append_event(
        db,
        decision=decision,
        policy_version=settings.policy_uri_default,
        sub=req.sub,
        pdev_action="egl_circuit_breaker",
        event_metadata={
            "breaker_action": action,
            "cognitive_load": req.cognitive_load,
            "emotional_state": req.emotional_state,
            "action_risk": req.action_risk,
        },
    )

    db.add(
        EGLSignalEvent(
            sub=req.sub,
            event_type="circuit_breaker",
            cognitive_load=req.cognitive_load,
            emotional_state=req.emotional_state,
            action_risk=req.action_risk,
            breaker_action=action,
            ledger_event_id=ledger_event.event_id,
        )
    )
    db.commit()

    return CircuitBreakerResponse(breaker_action=action, reasons=reasons, ledger_event_id=ledger_event.event_id)


def consent_step_up(db: Session, req: ConsentStepUpRequest) -> ConsentStepUpResponse:
    required = req.tier == 2 and req.action_risk in IRREVERSIBLE_OR_HIGH_RISK

    if not required:
        status = "not_required"
        decision = "allow"
    elif req.confirmed:
        status = "approved"
        decision = "allow"
    else:
        status = "pending"
        decision = "review_required"

    ledger_event = ledger_service.append_event(
        db,
        decision=decision,
        policy_version=settings.policy_uri_default,
        sub=req.sub,
        signal_category=f"tier_{req.tier}",
        pdev_action="egl_consent_step_up",
        event_metadata={
            "status": status,
            "confirmation_type": req.confirmation_type,
            "action_risk": req.action_risk,
        },
    )

    db.add(
        EGLSignalEvent(
            sub=req.sub,
            event_type="consent_step_up",
            tier=req.tier,
            action_risk=req.action_risk,
            breaker_action=f"consent_step_up_{status}",
            ledger_event_id=ledger_event.event_id,
        )
    )
    db.commit()

    return ConsentStepUpResponse(status=status, required=required, ledger_event_id=ledger_event.event_id)
