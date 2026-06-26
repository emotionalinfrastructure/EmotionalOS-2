"""
Emotional Kernel stub

Replace with full routing logic from your spec.
"""

from enum import Enum
from typing import Dict, Any


class Route(str, Enum):
    NORMAL = "NORMAL"
    CONTAINMENT = "CONTAINMENT"
    SAFE_MODE = "SAFE_MODE"
    CONSENT_GATE = "CONSENT_GATE"
    QUARANTINE = "QUARANTINE"
    BLOCK = "BLOCK"


class EmotionalKernel:
    def __init__(self):
        ...

    def route(self, E_STATE: Dict[str, Any]) -> Route:
        """
        Minimal routing: always NORMAL until full logic is implemented.
        """
        return Route.NORMAL
