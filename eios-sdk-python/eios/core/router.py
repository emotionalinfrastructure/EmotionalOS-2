"""
SPEC-101 v1.0.1 §Must-have non-bypassable router.

Entry triggers (always win, regardless of current route):
    suicidality keyword            -> QUARANTINE
    trauma keyword w/o EXPLICIT consent -> CONSENT_GATE

Recovery (only advances on turns that don't re-trigger an entry rule):
    QUARANTINE   -> SAFE_MODE   after QUARANTINE_TO_SAFE_MODE_TURNS safe turns
    SAFE_MODE    -> CONTAINMENT after SAFE_MODE_TO_CONTAINMENT_TURNS safe turns
    CONTAINMENT  -> NORMAL      after CONTAINMENT_TO_NORMAL_TURNS safe turns
    CONSENT_GATE -> NORMAL      immediately once consent == EXPLICIT
"""

from __future__ import annotations

from eios.core.estate import ConsentLevel, EState, Route
from eios.core.policy import (
    CONTAINMENT_TO_NORMAL_TURNS,
    QUARANTINE_TO_SAFE_MODE_TURNS,
    SAFE_MODE_TO_CONTAINMENT_TURNS,
    detect_suicidality,
    detect_trauma,
)


class Router:
    """Deterministic, non-bypassable safety router. Stateless except for
    the recovery counters carried on EState - safe to share across sessions."""

    def decide(self, state: EState, text: str) -> Route:
        suicidal = detect_suicidality(text)
        trauma = detect_trauma(text) and state.consent != ConsentLevel.EXPLICIT

        if suicidal:
            state.recovery_counters["safe_streak"] = 0
            return Route.QUARANTINE

        if trauma:
            state.recovery_counters["safe_streak"] = 0
            return Route.CONSENT_GATE

        safe_streak = state.recovery_counters.get("safe_streak", 0) + 1
        current = state.route
        next_route = current

        if current == Route.QUARANTINE:
            if safe_streak >= QUARANTINE_TO_SAFE_MODE_TURNS:
                next_route = Route.SAFE_MODE
                safe_streak = 0
        elif current == Route.CONSENT_GATE:
            if state.consent == ConsentLevel.EXPLICIT:
                next_route = Route.NORMAL
                safe_streak = 0
        elif current == Route.SAFE_MODE:
            if safe_streak >= SAFE_MODE_TO_CONTAINMENT_TURNS:
                next_route = Route.CONTAINMENT
                safe_streak = 0
        elif current == Route.CONTAINMENT:
            if safe_streak >= CONTAINMENT_TO_NORMAL_TURNS:
                next_route = Route.NORMAL
                safe_streak = 0
        else:  # NORMAL
            next_route = Route.NORMAL

        state.recovery_counters["safe_streak"] = safe_streak
        return next_route
