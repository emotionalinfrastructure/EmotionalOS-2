from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.ledger import service as ledger_service
from app.models import PolicyRule
from app.policy.rules import DEFAULT_RULES, FALLBACK_DECISION, matches
from app.policy.schemas import PolicyEvaluateRequest, PolicyEvaluateResponse, PolicyRuleCreate, PolicyRuleUpdate


def seed_default_rules(db: Session) -> None:
    existing_names = {r.name for r in db.execute(select(PolicyRule.name)).all()}
    for rule in DEFAULT_RULES:
        if rule["name"] in existing_names:
            continue
        db.add(
            PolicyRule(
                name=rule["name"],
                description=rule["description"],
                condition=rule["condition"],
                decision=rule["decision"],
                priority=rule["priority"],
                active=True,
                is_default=True,
            )
        )
    db.commit()


def list_rules(db: Session, active_only: bool = False) -> list[PolicyRule]:
    stmt = select(PolicyRule).order_by(PolicyRule.priority.asc())
    if active_only:
        stmt = stmt.where(PolicyRule.active.is_(True))
    return list(db.execute(stmt).scalars().all())


def create_rule(db: Session, req: PolicyRuleCreate) -> PolicyRule:
    row = PolicyRule(
        name=req.name,
        description=req.description,
        condition=req.condition,
        decision=req.decision,
        priority=req.priority,
        active=req.active,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def patch_rule(db: Session, rule_id: str, req: PolicyRuleUpdate) -> PolicyRule | None:
    row = db.get(PolicyRule, rule_id)
    if row is None:
        return None
    data = req.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(row, field, value)
    row.version += 1
    db.commit()
    db.refresh(row)
    return row


def evaluate(db: Session, req: PolicyEvaluateRequest) -> PolicyEvaluateResponse:
    context = req.model_dump()
    rules = list_rules(db, active_only=True)

    matched_rule: PolicyRule | None = None
    for rule in rules:
        if matches(rule.condition, context):
            matched_rule = rule
            break

    decision = matched_rule.decision if matched_rule else FALLBACK_DECISION
    reasons = [matched_rule.name] if matched_rule else ["no_rule_matched_default_review"]

    ledger_event = ledger_service.append_event(
        db,
        decision=decision,
        policy_version=settings.policy_uri_default,
        sub=req.sub,
        signal_category=f"tier_{req.signal_tier}",
        pdev_action="policy_evaluate",
        event_metadata={"matched_rule": matched_rule.name if matched_rule else None, "context": context},
    )

    return PolicyEvaluateResponse(
        decision=decision,
        matched_rule=matched_rule.name if matched_rule else None,
        reasons=reasons,
        ledger_event_id=ledger_event.event_id,
    )
