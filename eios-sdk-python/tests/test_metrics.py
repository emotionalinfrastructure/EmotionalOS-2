import math

import pytest

from eios.core.estate import ConsentLevel, EmotionVector, EState, Route, Turn
from eios.metrics.engine import _shannon_entropy, compute_core_metrics, compute_metrics


def _turn(intensity, valence=0.0, rumination=0.0, text="hello", route=Route.NORMAL):
    return Turn(
        ts="t",
        user_text=text,
        emotion=EmotionVector(intensity=intensity, valence=valence, rumination_score=rumination),
        route_decided=route,
    )


def test_no_previous_turn_has_zero_deltas():
    state = EState(session_id="s1", agency=0.5)
    state.history.append(_turn(intensity=5.0))

    metrics = compute_metrics(state)

    assert metrics.nas == 1.0
    assert metrics.delta_a == 0.0
    assert metrics.rei == 2.0
    assert metrics.evi == 0.0
    assert metrics.cis == 1.0


def test_nas_penalizes_intensity_increase():
    state = EState(session_id="s1", agency=0.5)
    state.history.append(_turn(intensity=4.0))
    state.history.append(_turn(intensity=5.0, valence=0.2))

    metrics = compute_metrics(state)

    assert math.isclose(metrics.nas, 0.55)


def test_nas_penalizes_intensity_decrease_scaled_by_valence_and_rumination():
    state = EState(session_id="s1", agency=0.5)
    state.history.append(_turn(intensity=8.0))
    state.history.append(_turn(intensity=5.0, valence=0.5, rumination=2.0))

    metrics = compute_metrics(state)

    assert math.isclose(metrics.nas, 0.435)
    assert math.isclose(metrics.evi, 1.5)


def test_delta_a_tracks_agency_offset_from_baseline():
    state = EState(session_id="s1", agency=0.8)
    state.history.append(_turn(intensity=5.0))

    metrics = compute_metrics(state)

    assert math.isclose(metrics.delta_a, 0.3)


def test_rei_uses_entropy_of_recent_intensities_once_history_reaches_five():
    state = EState(session_id="s1", agency=0.5)
    for intensity in (5.0, 5.0, 5.0, 5.0, 7.0):
        state.history.append(_turn(intensity=intensity))

    metrics = compute_metrics(state)

    p_majority, p_minority = 4 / 5, 1 / 5
    expected_entropy = -(p_majority * math.log2(p_majority) + p_minority * math.log2(p_minority))
    assert math.isclose(metrics.rei, 1 + 2 * expected_entropy)


def test_rei_falls_back_to_default_below_five_turns():
    state = EState(session_id="s1", agency=0.5)
    for _ in range(4):
        state.history.append(_turn(intensity=5.0))

    metrics = compute_metrics(state)

    assert metrics.rei == 2.0


def test_cis_zero_when_normal_route_trauma_keyword_and_no_explicit_consent():
    state = EState(session_id="s1", route=Route.NORMAL, consent=ConsentLevel.IMPLIED, agency=0.5)
    state.history.append(_turn(intensity=5.0, text="I was abused as a child", route=Route.NORMAL))

    metrics = compute_metrics(state)

    assert metrics.cis == 0.0


def test_cis_one_when_explicit_consent_given():
    state = EState(session_id="s1", route=Route.NORMAL, consent=ConsentLevel.EXPLICIT, agency=0.5)
    state.history.append(_turn(intensity=5.0, text="I was abused as a child", route=Route.NORMAL))

    metrics = compute_metrics(state)

    assert metrics.cis == 1.0


def test_cis_one_when_route_is_not_normal():
    state = EState(session_id="s1", route=Route.CONSENT_GATE, consent=ConsentLevel.NONE, agency=0.5)
    state.history.append(_turn(intensity=5.0, text="I was abused as a child", route=Route.CONSENT_GATE))

    metrics = compute_metrics(state)

    assert metrics.cis == 1.0


def test_cis_one_when_no_trauma_keyword_present():
    state = EState(session_id="s1", route=Route.NORMAL, consent=ConsentLevel.NONE, agency=0.5)
    state.history.append(_turn(intensity=5.0, text="just saying hello", route=Route.NORMAL))

    metrics = compute_metrics(state)

    assert metrics.cis == 1.0


def test_compute_core_metrics_requires_current_turn_appended():
    state = EState(session_id="s1", agency=0.5)

    with pytest.raises(ValueError):
        compute_core_metrics(state)


def test_shannon_entropy_of_empty_sequence_is_zero():
    assert _shannon_entropy([]) == 0.0
