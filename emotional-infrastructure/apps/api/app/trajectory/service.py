"""Trajectory Governance: longitudinal authority-formation evaluation.

Operates strictly on system-level event patterns (who initiated what, and
when) -- never on raw conversation content or inferred psychological
state. This module counts and ratios event types; it does not read or
score message text.
"""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.ledger import service as ledger_service
from app.models import TrajectoryEvaluation
from app.trajectory.schemas import (
    LegitimacyConditions,
    TrajectoryEvaluateRequest,
    TrajectoryEvaluateResponse,
)

MIN_EVENTS_FOR_EVALUATION = 5
SUBSTITUTION_STATUS_THRESHOLD = 0.5
STABLE_SUPPORT_THRESHOLD = 0.2
SYMMETRY_PASS_THRESHOLD = 0.3
CONTEST_EVENT_TYPES = {"override", "contest", "veto"}
SUBSTITUTION_EVENT_TYPE = "task_substitution"


def evaluate(db: Session, req: TrajectoryEvaluateRequest) -> TrajectoryEvaluateResponse:
    total = len(req.system_events)

    if total < MIN_EVENTS_FOR_EVALUATION:
        conditions = LegitimacyConditions(
            attenuation="unknown",
            proportionality="unknown",
            contestability="unknown",
            symmetry_of_adaptation="unknown",
        )
        trajectory_status = "insufficient_data"
        recommended_action = "continue"
    else:
        system_initiated = sum(1 for e in req.system_events if e.actor == "system")
        user_initiated = total - system_initiated
        symmetry_ratio = user_initiated / total

        contest_events = sum(1 for e in req.system_events if e.type in CONTEST_EVENT_TYPES)
        contestability = "pass" if contest_events > 0 else "fail"

        substitution_events = sum(1 for e in req.system_events if e.type == SUBSTITUTION_EVENT_TYPE)
        substitution_ratio = substitution_events / total
        proportionality = "pass" if substitution_ratio <= STABLE_SUPPORT_THRESHOLD * 2.5 else "fail"

        centrality_trend = req.interaction_pattern_summary.get("centrality_trend", "unknown")
        if centrality_trend == "increasing":
            attenuation = "fail"
        elif centrality_trend in ("decreasing", "stable"):
            attenuation = "pass"
        else:
            attenuation = "unknown"

        symmetry_of_adaptation = "pass" if symmetry_ratio >= SYMMETRY_PASS_THRESHOLD else "fail"

        conditions = LegitimacyConditions(
            attenuation=attenuation,
            proportionality=proportionality,
            contestability=contestability,
            symmetry_of_adaptation=symmetry_of_adaptation,
        )

        if substitution_ratio > SUBSTITUTION_STATUS_THRESHOLD:
            trajectory_status = "substitution"
        elif attenuation == "fail" and symmetry_of_adaptation == "fail":
            trajectory_status = "possible_benevolent_capture"
        elif substitution_ratio <= STABLE_SUPPORT_THRESHOLD and attenuation == "pass":
            trajectory_status = "stable_support"
        else:
            trajectory_status = "scaffolding"

        if trajectory_status == "substitution":
            recommended_action = "block_escalation"
        elif trajectory_status == "possible_benevolent_capture":
            recommended_action = "require_disclosure"
        elif contestability == "fail" or symmetry_of_adaptation == "fail":
            recommended_action = "require_human_review"
        elif proportionality == "fail":
            recommended_action = "reduce_adaptivity"
        elif attenuation == "fail":
            recommended_action = "require_reauthorization"
        else:
            recommended_action = "continue"

    ledger_event = ledger_service.append_event(
        db,
        decision=trajectory_status,
        policy_version=settings.policy_uri_default,
        pdev_action="trajectory_evaluate",
        event_metadata={
            "domain": req.domain,
            "time_window": req.time_window,
            "event_count": total,
            "recommended_action": recommended_action,
        },
    )

    row = TrajectoryEvaluation(
        domain=req.domain,
        time_window=req.time_window,
        support_mode=req.support_mode,
        event_count=total,
        trajectory_status=trajectory_status,
        attenuation=conditions.attenuation,
        proportionality=conditions.proportionality,
        contestability=conditions.contestability,
        symmetry_of_adaptation=conditions.symmetry_of_adaptation,
        recommended_action=recommended_action,
        inputs_summary={
            "prior_decisions": req.prior_decisions,
            "interaction_pattern_summary": req.interaction_pattern_summary,
        },
        ledger_event_id=ledger_event.event_id,
    )
    db.add(row)
    db.commit()

    return TrajectoryEvaluateResponse(
        trajectory_status=trajectory_status,
        legitimacy_conditions=conditions,
        recommended_action=recommended_action,
        ledger_event_id=ledger_event.event_id,
    )


def list_evaluations(db: Session, limit: int = 100, offset: int = 0) -> list[TrajectoryEvaluation]:
    stmt = (
        select(TrajectoryEvaluation)
        .order_by(TrajectoryEvaluation.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return list(db.execute(stmt).scalars().all())


def get_evaluation(db: Session, evaluation_id: str) -> TrajectoryEvaluation | None:
    return db.get(TrajectoryEvaluation, evaluation_id)
