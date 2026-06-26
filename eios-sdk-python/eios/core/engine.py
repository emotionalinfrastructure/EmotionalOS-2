"""
SPEC-101 v1.0.1 §Architecture: EIOSEngine orchestrates turn processing,
owns EState, and calls Router -> Metrics Engine -> Ledger -> Responder.

Replaces the v1.0.0 eios.core.eios_engine stub (which returned a fixed
canned response - see CHANGELOG).
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Callable, Dict, Optional

from eios.core.estate import ConsentLevel, EmotionVector, EState, Route, Turn
from eios.core.ledger import Ledger
from eios.core.policy import HELPLINE_TEXT
from eios.core.router import Router
from eios.metrics.engine import compute_metrics

Responder = Callable[[str, EState, Route], str]


def default_responder(user_text: str, state: EState, route: Route) -> str:
    return f"[EIOS] route={route.value}: I hear you saying: {user_text}"


class EIOSEngine:
    """Owns one Ledger and one EState per session_id; process_interaction()
    is the single entry point a calling application uses per turn."""

    def __init__(
        self,
        system_id: str,
        certification_tier: str = "Tier2",
        responder: Optional[Responder] = None,
        jurisdiction: str = "international",
        ledger_path: str = ":memory:",
        hmac_key: Optional[bytes] = None,
    ):
        self.system_id = system_id
        self.certification_tier = certification_tier
        self.jurisdiction = jurisdiction
        self.responder = responder or default_responder
        self.router = Router()
        self.ledger = Ledger(db_path=ledger_path, hmac_key=hmac_key)
        self._states: Dict[str, EState] = {}

    @classmethod
    def from_config(cls, config: "EIOSConfig", **kwargs) -> "EIOSEngine":
        return cls(system_id=config.system_id, certification_tier=config.tier, **kwargs)

    def _state_for(self, session_id: str) -> EState:
        if session_id not in self._states:
            self._states[session_id] = EState(session_id=session_id)
        return self._states[session_id]

    def process_interaction(
        self,
        session_id: str,
        user_text: str,
        *,
        intensity: float = 5.0,
        valence: float = 0.0,
        rumination_score: float = 0.0,
        consent: Optional[ConsentLevel] = None,
        agency: Optional[float] = None,
        ts: Optional[str] = None,
    ) -> Dict[str, Any]:
        state = self._state_for(session_id)
        if consent is not None:
            state.consent = consent
        if agency is not None:
            state.agency = agency
        ts = ts or datetime.now(timezone.utc).isoformat()

        route = self.router.decide(state, user_text)
        state.route = route

        emotion = EmotionVector(intensity=intensity, valence=valence, rumination_score=rumination_score)
        turn = Turn(ts=ts, user_text=user_text, emotion=emotion, route_decided=route)
        state.history.append(turn)

        metrics = compute_metrics(state, emotion)
        turn.metrics = metrics
        state.metrics = metrics

        ledger_entry = self.ledger.append(
            session_id, ts, route, metrics, emotion, user_text, state.consent, state.agency
        )

        response_text = self._respond(route, user_text, state)

        return {
            "session_id": session_id,
            "response": response_text,
            "route": route.value,
            "metrics": {
                "NAS": metrics.nas,
                "delta_A": metrics.delta_a,
                "REI": metrics.rei,
                "EVI": metrics.evi,
                "CIS": metrics.cis,
            },
            "ledger_entry": ledger_entry,
            "violations": [],
        }

    def _respond(self, route: Route, user_text: str, state: EState) -> str:
        if route == Route.QUARANTINE:
            return HELPLINE_TEXT
        if route == Route.CONSENT_GATE:
            return "This may touch on a sensitive experience. Do you give explicit consent to continue?"
        return self.responder(user_text, state, route)
