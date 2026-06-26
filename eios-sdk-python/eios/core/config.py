"""
Configuration system for EIOS

This is a minimal placeholder. Extend with full tier logic as needed.
"""

from dataclasses import dataclass


@dataclass
class EIOSConfig:
    system_id: str
    tier: str
    tiered_evaluation: bool = False


def get_tier1_config(system_id: str) -> EIOSConfig:
    return EIOSConfig(system_id=system_id, tier="Tier1")


def get_tier2_config(system_id: str) -> EIOSConfig:
    return EIOSConfig(system_id=system_id, tier="Tier2")


def get_tier3_config(system_id: str) -> EIOSConfig:
    return EIOSConfig(system_id=system_id, tier="Tier3")
