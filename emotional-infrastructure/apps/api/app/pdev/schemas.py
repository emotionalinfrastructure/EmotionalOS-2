from __future__ import annotations

from pydantic import BaseModel, Field

from app.schemas import ContextEnvelope


class PDEVEvaluateRequest(BaseModel):
    sub: str
    purpose: str
    requested_feature: str
    token: str | None = Field(default=None, description="CTP JWT presented as evidence of consent")
    context: ContextEnvelope | None = None
    signal_tier: int = Field(default=0, ge=0, le=3)
    action_risk: str = Field(default="low", pattern="^(low|medium|high|irreversible)$")
    step_up_confirmed: bool = False
    hidden_steering: bool = False
    veto_requested: bool = False
    policy_version: str | None = None


class PDEVEvaluateResponse(BaseModel):
    decision: str
    purpose: str
    dignity: str
    evidence: str
    veto: str
    reasons: list[str]
    ledger_event_id: str | None = None
