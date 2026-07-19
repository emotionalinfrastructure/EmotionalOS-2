"""Behavioral Signal Taxonomy registry.

A fixed reference table of governed signal categories. The MVP boundary
(spec section 13.4) applies: submitted values are pre-computed numeric
magnitudes from client-side instrumentation, never raw personal content,
and this module maps them to governance risk tiers -- it does not
diagnose, profile, or clinically label anyone.
"""
from __future__ import annotations

TAXONOMY: list[dict[str, str]] = [
    {"code": "K-01", "family": "Kinetic and Kinematic", "name": "Keystroke Dynamics",
     "description": "Timing and rhythm statistics of keystroke entry."},
    {"code": "K-02", "family": "Kinetic and Kinematic", "name": "Pressure/Force",
     "description": "Input pressure or force magnitude on supporting hardware."},
    {"code": "K-03", "family": "Kinetic and Kinematic", "name": "Cursor Pathing",
     "description": "Pointer movement path statistics (deviation, hesitation)."},
    {"code": "K-04", "family": "Kinetic and Kinematic", "name": "Dwell Time",
     "description": "Time spent on an element or screen before acting."},
    {"code": "L-01", "family": "Syntactic and Linguistic", "name": "Qualifier Density",
     "description": "Rate of hedging/qualifying language markers."},
    {"code": "L-02", "family": "Syntactic and Linguistic", "name": "Deletional Editing",
     "description": "Rate of content deletion/revision during composition."},
    {"code": "L-03", "family": "Syntactic and Linguistic", "name": "Pronominal Shift",
     "description": "Change in pronoun usage patterns across a session."},
    {"code": "L-04", "family": "Syntactic and Linguistic", "name": "Syntactic Complexity",
     "description": "Structural complexity of submitted text."},
    {"code": "T-01", "family": "Temporal and Process", "name": "Latency Response",
     "description": "Response latency relative to session baseline."},
    {"code": "T-02", "family": "Temporal and Process", "name": "Session Velocity",
     "description": "Rate of interactions per unit time."},
    {"code": "T-03", "family": "Temporal and Process", "name": "Burstiness",
     "description": "Variance/clustering of interaction timing."},
    {"code": "T-04", "family": "Temporal and Process", "name": "Circadian Deviation",
     "description": "Deviation of interaction timing from the user's typical time-of-day pattern."},
]

TAXONOMY_BY_CODE: dict[str, dict[str, str]] = {entry["code"]: entry for entry in TAXONOMY}

TIER2_THRESHOLD = 0.75
TIER1_THRESHOLD = 0.4


def magnitude_to_tier(value: float) -> int:
    if value >= TIER2_THRESHOLD:
        return 2
    if value >= TIER1_THRESHOLD:
        return 1
    return 0
