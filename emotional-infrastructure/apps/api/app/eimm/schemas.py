from __future__ import annotations

from pydantic import BaseModel, Field


class MaturityLevelInfo(BaseModel):
    level: int
    name: str
    description: str
    aspirational_only: bool


class LevelsResponse(BaseModel):
    levels: list[MaturityLevelInfo]
    claim_boundary_note: str


class AssessRequest(BaseModel):
    domain: str = "general"
    criteria: dict[str, bool] = Field(default_factory=dict)


class AssessResponse(BaseModel):
    maturity_level: int
    level_name: str
    score: float
    satisfied_criteria: list[str]
    missing_criteria: list[str]
    certification_body_exists: bool
    claim_boundary_note: str
    launch_gate_id: str
