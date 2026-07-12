"""EIMM: Emotional Infrastructure Maturity Model self-assessment.

Levels 4 (Validated) and 5 (Movement-Led) are aspirational maturity
targets: this reference implementation has no external certification
authority, so an assessment can never itself constitute certification,
regulator approval, or clinical validation regardless of which criteria
are marked true.
"""
from __future__ import annotations

from app.eimm.schemas import AssessRequest, AssessResponse, LevelsResponse, MaturityLevelInfo
from app.ledger import service as ledger_service
from app.config import settings
from app.models import LaunchGateRecord
from sqlalchemy.orm import Session

CLAIM_NOTE = (
    "This assessment is a self-reported maturity indicator produced by the reference "
    "implementation's own criteria checklist. No external certification authority, "
    "regulator, or standards body has reviewed or endorsed this result."
)

LEVELS: list[dict] = [
    {"level": 1, "name": "Reactive", "description": "Ad hoc handling of emotional/behavioral signals; no formal governance.", "aspirational_only": False},
    {"level": 2, "name": "Aware", "description": "Governance vocabulary and signal taxonomy documented.", "aspirational_only": False},
    {"level": 3, "name": "Managed", "description": "Consent protocol, policy engine, and audit trail implemented and enforced.", "aspirational_only": False},
    {"level": 4, "name": "Validated", "description": "Automated test coverage plus independent external audit completed.", "aspirational_only": True},
    {"level": 5, "name": "Movement-Led", "description": "Regulator engagement, standards-body adoption, and cross-organization coalition.", "aspirational_only": True},
]

LEVEL_REQUIREMENTS: dict[int, list[str]] = {
    2: ["governance_documented", "signal_taxonomy_defined"],
    3: ["consent_protocol_implemented", "policy_engine_implemented", "audit_trail_implemented"],
    4: ["automated_tests_passing", "external_audit_completed"],
    5: ["regulator_engagement", "standards_body_adoption", "movement_coalition_formed"],
}


def get_levels() -> LevelsResponse:
    return LevelsResponse(
        levels=[MaturityLevelInfo(**level) for level in LEVELS],
        claim_boundary_note=CLAIM_NOTE,
    )


def assess(db: Session, req: AssessRequest) -> AssessResponse:
    satisfied: list[str] = []
    missing: list[str] = []
    achieved_level = 1

    for level in (2, 3, 4, 5):
        required = LEVEL_REQUIREMENTS[level]
        level_missing = [c for c in required if not req.criteria.get(c, False)]
        if level_missing:
            missing.extend(level_missing)
            break
        satisfied.extend(required)
        achieved_level = level

    total_criteria = sum(len(v) for v in LEVEL_REQUIREMENTS.values())
    score = len(satisfied) / total_criteria if total_criteria else 0.0
    level_name = next(level["name"] for level in LEVELS if level["level"] == achieved_level)

    row = LaunchGateRecord(
        gate_name="eimm_assessment",
        domain=req.domain,
        status="pass" if achieved_level >= 3 else "review_required",
        score=score,
        maturity_level=achieved_level,
        criteria=req.criteria,
        notes=CLAIM_NOTE,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    ledger_service.append_event(
        db,
        decision="allow" if achieved_level >= 3 else "review_required",
        policy_version=settings.policy_uri_default,
        pdev_action="eimm_assess",
        event_metadata={"domain": req.domain, "maturity_level": achieved_level, "launch_gate_id": row.id},
    )

    return AssessResponse(
        maturity_level=achieved_level,
        level_name=level_name,
        score=round(score, 4),
        satisfied_criteria=satisfied,
        missing_criteria=missing,
        certification_body_exists=False,
        claim_boundary_note=CLAIM_NOTE,
        launch_gate_id=row.id,
    )
