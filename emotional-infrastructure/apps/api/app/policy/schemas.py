from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class PolicyRuleOut(BaseModel):
    id: str
    name: str
    description: str
    condition: dict[str, Any]
    decision: str
    priority: int
    active: bool
    version: int
    is_default: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PolicyRuleCreate(BaseModel):
    name: str
    description: str
    condition: dict[str, Any]
    decision: str = Field(pattern="^(allow|deny|review_required|reauthorization_required|vetoed)$")
    priority: int = 100
    active: bool = True


class PolicyRuleUpdate(BaseModel):
    description: str | None = None
    condition: dict[str, Any] | None = None
    decision: str | None = None
    priority: int | None = None
    active: bool | None = None


class PolicyEvaluateRequest(BaseModel):
    sub: str | None = None
    token_present: bool = False
    token_valid: bool = False
    token_revoked: bool = False
    context_match: bool = True
    signal_tier: int = Field(default=0, ge=0, le=3)
    action_risk: str = Field(default="low", pattern="^(low|medium|high|irreversible)$")
    step_up_confirmed: bool = False
    acts_on_inferred_state: bool = False
    tar_authorized: bool = False
    substitution_risk_elevated: bool = False
    is_steering: bool = False


class PolicyEvaluateResponse(BaseModel):
    decision: str
    matched_rule: str | None
    reasons: list[str]
    ledger_event_id: str | None = None
