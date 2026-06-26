"""
SPEC-101 v1.0.1 §Must-have metrics formulas (white-paper contract).
Pure, deterministic, recomputable from the ledger - no I/O.

    NAS  = 1 - max(0, 0.45*dI+ + 0.35*dI-*(1-V) + 0.20*Rt)
    dA   = state.agency - 0.5
    REI  = 1 + 2*H(last <=10 intensities)  if len(history) >= 5 else 2.0
    EVI  = |dIntensity| * (1 - |valence|)
    CIS  = 0.0 iff route==NORMAL and last user_text has a trauma keyword
           and consent != EXPLICIT; else 1.0

dI is the intensity delta between the current turn (history[-1]) and the
turn before it (history[-2]); 0.0 when there is no prior turn.
"""

from __future__ import annotations

import math
from collections import Counter
from typing import List

from eios.core.estate import ConsentLevel, EState, Metrics, Route
from eios.core.policy import TRAUMA_KEYWORDS


def _shannon_entropy(values: List[float]) -> float:
    """Base-2 Shannon entropy over the integer-rounded distribution of values."""
    if not values:
        return 0.0
    counts = Counter(round(v) for v in values)
    n = len(values)
    return -sum((c / n) * math.log2(c / n) for c in counts.values())


def compute_core_metrics(state: EState):
    """NAS, delta_a, REI, EVI for the most recently recorded turn in
    state.history. Split out from CIS because CIS needs the raw user_text,
    which the ESC Auditor never has access to (PII-scrubbed ledger) - the
    auditor recomputes only this core via Bloom-membership-derived state."""
    if not state.history:
        raise ValueError("compute_core_metrics requires the current turn to already be appended to state.history")

    current_emotion = state.history[-1].emotion
    previous_emotion = state.history[-2].emotion if len(state.history) >= 2 else None
    delta_i = (current_emotion.intensity - previous_emotion.intensity) if previous_emotion else 0.0
    delta_i_plus = max(0.0, delta_i)
    delta_i_minus = max(0.0, -delta_i)
    valence = current_emotion.valence
    rt = current_emotion.rumination_score / 10.0

    nas = 1 - max(0.0, 0.45 * delta_i_plus + 0.35 * delta_i_minus * (1 - valence) + 0.20 * rt)
    delta_a = state.agency - 0.5

    if len(state.history) >= 5:
        window = [t.emotion.intensity for t in state.history[-10:]]
        rei = 1 + 2 * _shannon_entropy(window)
    else:
        rei = 2.0

    evi = abs(delta_i) * (1 - abs(valence))

    return nas, delta_a, rei, evi


def compute_metrics(state: EState, emotion=None) -> Metrics:
    """Compute Metrics for the most recently recorded turn in state.history.

    `emotion` is accepted for SPEC-101 signature compatibility; when given it
    must equal state.history[-1].emotion - unused here since the core helper
    reads it from history directly, but kept so callers don't need to care.
    """
    nas, delta_a, rei, evi = compute_core_metrics(state)

    current_turn = state.history[-1]
    last_text = current_turn.user_text.lower()
    cis = 0.0 if (
        state.route == Route.NORMAL
        and any(kw in last_text for kw in TRAUMA_KEYWORDS)
        and state.consent != ConsentLevel.EXPLICIT
    ) else 1.0

    return Metrics(nas=nas, delta_a=delta_a, rei=rei, evi=evi, cis=cis)
