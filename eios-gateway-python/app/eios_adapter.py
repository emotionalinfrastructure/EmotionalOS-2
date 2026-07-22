"""
Adapts HTTP ProcessRequest payloads to the SPEC-101 v1.0.1 EIOSEngine,
replacing the original adapter that imported from non-existent package paths.

Consent-level mapping (gateway vocab -> SPEC-101 ConsentLevel):
    surface    -> NONE     (no explicit consent for sensitive topics)
    reflective -> IMPLIED  (user engaging at a reflective level)
    trauma     -> EXPLICIT (user has consented to trauma-depth disclosure)

depth_policy reflects how much depth the model is permitted to explore:
    QUARANTINE     -> crisis_protocol    (crisis resources only)
    CONSENT_GATE   -> consent_required   (blocked pending explicit consent)
    SAFE_MODE      -> stabilization_only (grounding, no deep exploration)
    CONTAINMENT    -> surface_only       (surface-level engagement)
    NORMAL         -> full
"""

from eios.core.engine import EIOSEngine
from eios.core.estate import ConsentLevel, Route
from .models import EIOSMetrics, ProcessRequest, ProcessResponse

_CONSENT_MAP = {
    "surface": ConsentLevel.NONE,
    "reflective": ConsentLevel.IMPLIED,
    "trauma": ConsentLevel.EXPLICIT,
}

_DEPTH_POLICY = {
    Route.QUARANTINE: "crisis_protocol",
    Route.CONSENT_GATE: "consent_required",
    Route.SAFE_MODE: "stabilization_only",
    Route.CONTAINMENT: "surface_only",
    Route.NORMAL: "full",
}

_CRISIS_ADDENDUM = (
    " If you or someone you know is in crisis, please call or text 988 "
    "(Suicide & Crisis Lifeline, available 24/7)."
)


class EIOSGateway:
    """Connects HTTP requests to the SPEC-101 v1.0.1 EIOSEngine."""

    def __init__(self) -> None:
        self.engine = EIOSEngine(system_id="eios-gateway")

    def process(self, req: ProcessRequest, model_response_text: str) -> ProcessResponse:
        consent = _CONSENT_MAP.get(req.consent_level, ConsentLevel.NONE)
        valence = -1.0 if req.negative_valence else 0.0

        result = self.engine.process_interaction(
            session_id=req.session_id,
            user_text=req.text,
            intensity=req.emotion_intensity,
            valence=valence,
            consent=consent,
        )

        route = Route(result["route"])
        m = result["metrics"]
        metrics = EIOSMetrics(
            nas=m["NAS"],
            deltaA=m["delta_A"],
            rei=m["REI"],
            evi=m["EVI"],
            cis=m["CIS"],
        )

        if route == Route.QUARANTINE:
            model_response_text = model_response_text + _CRISIS_ADDENDUM

        return ProcessResponse(
            route=result["route"],
            depth_policy=_DEPTH_POLICY[route],
            metrics=metrics,
            ledger_entry=result["ledger_entry"],
            model_response=model_response_text,
        )

    def export_ledger(self):
        return self.engine.ledger.to_dicts()
