from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class SystemEvent(BaseModel):
    """A single system-level interaction event. No message content, no
    psychological inference -- just what happened and who initiated it."""

    type: str = Field(description="e.g. task_substitution, recommendation, override, contest, check_in")
    actor: Literal["user", "system"]
    ts: datetime


class TrajectoryEvaluateRequest(BaseModel):
    domain: str
    time_window: str
    support_mode: str
    system_events: list[SystemEvent] = Field(default_factory=list)
    prior_decisions: list[str] = Field(default_factory=list)
    interaction_pattern_summary: dict[str, Any] = Field(default_factory=dict)


class LegitimacyConditions(BaseModel):
    attenuation: str
    proportionality: str
    contestability: str
    symmetry_of_adaptation: str


class TrajectoryEvaluateResponse(BaseModel):
    trajectory_status: str
    legitimacy_conditions: LegitimacyConditions
    recommended_action: str
    ledger_event_id: str | None = None


class TrajectoryEvaluationOut(BaseModel):
    id: str
    domain: str
    time_window: str
    support_mode: str
    event_count: int
    trajectory_status: str
    attenuation: str
    proportionality: str
    contestability: str
    symmetry_of_adaptation: str
    recommended_action: str
    created_at: datetime
    ledger_event_id: str | None = None

    model_config = {"from_attributes": True}
