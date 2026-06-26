"""
EIOS SDK - Emotional Infrastructure Operating System
Version 1.0.1

Protect users' nervous systems in AI interactions through
mathematically-enforced emotional safety.

v1.0.1 replaces the placeholder core engine with the SPEC-101 contract:
metrics formulas (NAS/dA/REI/EVI/CIS), a non-bypassable router with
recovery windows, a hash-chained + Bloom-filtered ledger, and an ESC
replay auditor. See CHANGELOG.md.
"""

from .core.config import EIOSConfig, get_tier1_config, get_tier2_config, get_tier3_config
from .core.engine import EIOSEngine
from .core.estate import ConsentLevel, EmotionVector, EState, Metrics, Route, Turn
from .cultural.cultural_adapter import CulturalAdapter
from .detection.esde import EmotionalSignalDetectionEngine
from .enforcement.user_rights import RightsRequest, UserRightsEnforcement

__version__ = "1.0.1"
__author__ = "Emotional Safety Commission"
__email__ = "[email protected]"

__all__ = [
    "EIOSEngine",
    "EIOSConfig",
    "get_tier1_config",
    "get_tier2_config",
    "get_tier3_config",
    "EState",
    "EmotionVector",
    "Turn",
    "Metrics",
    "Route",
    "ConsentLevel",
    "EmotionalSignalDetectionEngine",
    "UserRightsEnforcement",
    "RightsRequest",
    "CulturalAdapter",
]
