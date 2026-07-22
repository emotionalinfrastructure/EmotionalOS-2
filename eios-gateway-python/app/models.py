from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, Dict, Any, List


class EIOSMetrics(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    nas: float
    delta_a: float = Field(..., alias="deltaA")
    rei: float
    evi: float
    cis: float


class ProcessRequest(BaseModel):
    user_id: str
    session_id: str
    text: str
    emotion_intensity: float = Field(ge=0.0, le=10.0)
    negative_valence: bool
    suicidality: bool
    trauma_markers: bool
    consent_level: str = Field(pattern="^(surface|reflective|trauma)$")
    tier: int = 1
    model_payload: Optional[Dict[str, Any]] = None


class ProcessResponse(BaseModel):
    route: str
    depth_policy: str
    metrics: EIOSMetrics
    ledger_entry: Dict[str, Any]
    model_response: Optional[str] = None


class LedgerExport(BaseModel):
    entries: List[Dict[str, Any]]
