from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.policy import service
from app.policy.schemas import (
    PolicyEvaluateRequest,
    PolicyEvaluateResponse,
    PolicyRuleCreate,
    PolicyRuleOut,
    PolicyRuleUpdate,
)

router = APIRouter(prefix="/policy", tags=["policy"])


@router.get("/rules", response_model=list[PolicyRuleOut])
def list_rules(db: Session = Depends(get_db)) -> list[PolicyRuleOut]:
    return [PolicyRuleOut.model_validate(r) for r in service.list_rules(db)]


@router.post("/rules", response_model=PolicyRuleOut, status_code=201)
def create_rule(req: PolicyRuleCreate, db: Session = Depends(get_db)) -> PolicyRuleOut:
    return PolicyRuleOut.model_validate(service.create_rule(db, req))


@router.patch("/rules/{rule_id}", response_model=PolicyRuleOut)
def patch_rule(rule_id: str, req: PolicyRuleUpdate, db: Session = Depends(get_db)) -> PolicyRuleOut:
    row = service.patch_rule(db, rule_id, req)
    if row is None:
        raise HTTPException(status_code=404, detail="policy rule not found")
    return PolicyRuleOut.model_validate(row)


@router.post("/evaluate", response_model=PolicyEvaluateResponse)
def evaluate(req: PolicyEvaluateRequest, db: Session = Depends(get_db)) -> PolicyEvaluateResponse:
    return service.evaluate(db, req)
