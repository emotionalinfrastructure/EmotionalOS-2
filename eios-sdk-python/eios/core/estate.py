"""
SPEC-101 v1.0.1 data model: Route, ConsentLevel, EmotionVector, Turn, Metrics, EState.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class Route(str, Enum):
    NORMAL = "NORMAL"
    SAFE_MODE = "SAFE_MODE"
    CONTAINMENT = "CONTAINMENT"
    CONSENT_GATE = "CONSENT_GATE"
    QUARANTINE = "QUARANTINE"


class ConsentLevel(str, Enum):
    NONE = "none"
    IMPLIED = "implied"
    EXPLICIT = "explicit"


@dataclass
class EmotionVector:
    intensity: float
    valence: float  # [-1, 1]
    rumination_score: float  # [0, 10]


@dataclass
class Metrics:
    nas: float
    delta_a: float
    rei: float
    evi: float
    cis: float

    def as_dict(self) -> Dict[str, float]:
        return {
            "nas": self.nas,
            "delta_a": self.delta_a,
            "rei": self.rei,
            "evi": self.evi,
            "cis": self.cis,
        }


@dataclass
class Turn:
    ts: str
    user_text: str
    emotion: EmotionVector
    route_decided: Route
    metrics: Optional[Metrics] = None


@dataclass
class EState:
    session_id: str
    route: Route = Route.NORMAL
    consent: ConsentLevel = ConsentLevel.NONE
    agency: float = 0.5
    history: List[Turn] = field(default_factory=list)
    metrics: Optional[Metrics] = None
    recovery_counters: Dict[str, Any] = field(default_factory=dict)
