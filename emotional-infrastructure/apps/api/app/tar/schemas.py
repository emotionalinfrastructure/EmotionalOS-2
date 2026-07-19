from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class AuthorizeRequest(BaseModel):
    sub: str
    inference_ref: str = Field(description="Opaque reference to an inference event, never raw content")
    authorized_action: str
    action_risk: str = Field(pattern="^(low|medium|high|irreversible)$")
    ttl_seconds: int = Field(gt=0, le=86400, default=300)
    escalation_allowed: bool = False


class AuthorizationOut(BaseModel):
    id: str
    sub: str
    inference_ref: str
    authorized_action: str
    action_risk: str
    escalation_allowed: bool
    status: str
    authorized_at: datetime
    expires_at: datetime
    ledger_event_id: str | None = None

    model_config = {"from_attributes": True}


class EvaluateRequest(BaseModel):
    authorization_id: str
    requested_action_risk: str = Field(pattern="^(low|medium|high|irreversible)$")
    requested_escalation: bool = False


class EvaluateResponse(BaseModel):
    decision: str
    valid_now: bool
    expires_at: datetime | None
    escalation_allowed: bool
    reauthorization_required: bool
    reasons: list[str]
    ledger_event_id: str | None = None


class ExpireRequest(BaseModel):
    authorization_id: str
    reason: str = "manually_expired"


class ExpireResponse(BaseModel):
    id: str
    status: str
    ledger_event_id: str | None = None
