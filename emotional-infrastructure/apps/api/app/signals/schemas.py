from __future__ import annotations

from pydantic import BaseModel, Field


class TaxonomyEntry(BaseModel):
    code: str
    family: str
    name: str
    description: str


class TaxonomyResponse(BaseModel):
    entries: list[TaxonomyEntry]


class SignalEvaluateRequest(BaseModel):
    sub: str
    code: str = Field(pattern="^(K-0[1-4]|L-0[1-4]|T-0[1-4])$")
    value: float = Field(ge=0.0, le=1.0)


class SignalEvaluateResponse(BaseModel):
    code: str
    family: str
    governance_risk_tier: int
    rationale: str
    ledger_event_id: str | None = None
