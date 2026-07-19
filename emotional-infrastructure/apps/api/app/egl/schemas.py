from __future__ import annotations

from pydantic import BaseModel, Field


class SignalFeatures(BaseModel):
    """Pre-computed, non-content behavioral signal magnitudes (0.0-1.0).

    These are numeric scores produced by client-side instrumentation
    (timing, editing, pacing statistics) -- never raw message text -- so
    EGL classification never inspects personal content.
    """

    urgency_score: float = Field(default=0.0, ge=0.0, le=1.0)
    repetition_score: float = Field(default=0.0, ge=0.0, le=1.0)
    pacing_score: float = Field(default=0.0, ge=0.0, le=1.0)
    exhaustion_score: float = Field(default=0.0, ge=0.0, le=1.0)
    confusion_score: float = Field(default=0.0, ge=0.0, le=1.0)
    epistemic_surrender_score: float = Field(default=0.0, ge=0.0, le=1.0)
    profiling_vector_score: float = Field(default=0.0, ge=0.0, le=1.0)
    attachment_building_score: float = Field(default=0.0, ge=0.0, le=1.0)
    insecurity_exploitation_score: float = Field(default=0.0, ge=0.0, le=1.0)


class ClassifySignalRequest(BaseModel):
    sub: str
    features: SignalFeatures = Field(default_factory=SignalFeatures)


class ClassifySignalResponse(BaseModel):
    tier: int
    tier_label: str
    signal_codes: list[str]
    decision: str
    ledger_event_id: str | None = None


class CircuitBreakerRequest(BaseModel):
    sub: str
    cognitive_load: str = Field(pattern="^(low|medium|high)$")
    emotional_state: str = Field(pattern="^(stable_flow|distress_vulnerable|unknown)$")
    action_risk: str = Field(pattern="^(low|medium|high|irreversible)$")


class CircuitBreakerResponse(BaseModel):
    breaker_action: str
    reasons: list[str]
    ledger_event_id: str | None = None


class ConsentStepUpRequest(BaseModel):
    sub: str
    tier: int = Field(ge=0, le=3)
    action_risk: str = Field(pattern="^(low|medium|high|irreversible)$")
    confirmation_type: str = Field(pattern="^(typed_confirmation|cooldown_delay)$")
    confirmed: bool = False


class ConsentStepUpResponse(BaseModel):
    status: str
    required: bool
    ledger_event_id: str | None = None
