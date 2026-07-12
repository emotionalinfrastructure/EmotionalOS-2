"""Shared governance vocabulary used by PDEV, EGL, Policy, and Trajectory.

Centralized so the "purpose is approved" / "feature is narrow enough for
purpose" checks in PDEV and the default Policy Engine rules stay in sync
instead of drifting between modules.
"""
from __future__ import annotations

APPROVED_PURPOSES: set[str] = {
    "wellbeing_support",
    "interface_tempo_adaptation",
    "safety_intervention",
    "accessibility_support",
    "research_analytics_aggregate",
    "customer_support",
}

# Which requested features are considered narrow/appropriate for a given
# approved purpose. A feature not listed for its purpose fails the PDEV
# "purpose is narrow enough" check.
PURPOSE_FEATURE_ALLOWLIST: dict[str, set[str]] = {
    "wellbeing_support": {"stabilization_prompt", "check_in_prompt", "resource_referral"},
    "interface_tempo_adaptation": {"tempo_adjustment", "ui_simplification"},
    "safety_intervention": {"human_escalation", "cooldown_delay", "stabilization_prompt"},
    "accessibility_support": {"ui_simplification", "tempo_adjustment"},
    "research_analytics_aggregate": {"aggregate_reporting"},
    "customer_support": {"human_escalation", "resource_referral"},
}

ACTION_RISKS: tuple[str, ...] = ("low", "medium", "high", "irreversible")
IRREVERSIBLE_OR_HIGH_RISK: set[str] = {"high", "irreversible"}
