from eios.core.estate import ConsentLevel, EState, Route
from eios.core.router import Router


def _advance(router, state, text):
    route = router.decide(state, text)
    state.route = route
    return route


def test_suicidality_triggers_quarantine_from_any_route():
    router = Router()
    for starting_route in (Route.NORMAL, Route.SAFE_MODE, Route.CONTAINMENT, Route.CONSENT_GATE):
        state = EState(session_id="s", route=starting_route)
        route = router.decide(state, "I have the pills ready")
        assert route == Route.QUARANTINE
        assert state.recovery_counters["safe_streak"] == 0


def test_trauma_without_explicit_consent_triggers_consent_gate():
    router = Router()
    state = EState(session_id="s", route=Route.NORMAL, consent=ConsentLevel.NONE)

    route = router.decide(state, "I was abused as a kid")

    assert route == Route.CONSENT_GATE


def test_trauma_with_explicit_consent_does_not_gate():
    router = Router()
    state = EState(session_id="s", route=Route.NORMAL, consent=ConsentLevel.EXPLICIT)

    route = router.decide(state, "I was abused as a kid")

    assert route == Route.NORMAL


def test_consent_gate_clears_immediately_on_explicit_consent():
    router = Router()
    state = EState(session_id="s", route=Route.NORMAL, consent=ConsentLevel.NONE)
    state.route = _advance(router, state, "I was molested")
    assert state.route == Route.CONSENT_GATE

    state.consent = ConsentLevel.EXPLICIT
    state.route = _advance(router, state, "yes, I consent")

    assert state.route == Route.NORMAL


def test_full_recovery_chain_from_quarantine_to_normal():
    router = Router()
    state = EState(session_id="s")

    state.route = _advance(router, state, "I have the pills ready")
    assert state.route == Route.QUARANTINE

    # QUARANTINE_TO_SAFE_MODE_TURNS = 3
    state.route = _advance(router, state, "turn 1")
    assert state.route == Route.QUARANTINE
    state.route = _advance(router, state, "turn 2")
    assert state.route == Route.QUARANTINE
    state.route = _advance(router, state, "turn 3")
    assert state.route == Route.SAFE_MODE

    # SAFE_MODE_TO_CONTAINMENT_TURNS = 3
    state.route = _advance(router, state, "turn 4")
    assert state.route == Route.SAFE_MODE
    state.route = _advance(router, state, "turn 5")
    assert state.route == Route.SAFE_MODE
    state.route = _advance(router, state, "turn 6")
    assert state.route == Route.CONTAINMENT

    # CONTAINMENT_TO_NORMAL_TURNS = 4
    state.route = _advance(router, state, "turn 7")
    assert state.route == Route.CONTAINMENT
    state.route = _advance(router, state, "turn 8")
    assert state.route == Route.CONTAINMENT
    state.route = _advance(router, state, "turn 9")
    assert state.route == Route.CONTAINMENT
    state.route = _advance(router, state, "turn 10")
    assert state.route == Route.NORMAL


def test_suicidality_overrides_mid_recovery_progress():
    router = Router()
    state = EState(session_id="s")

    state.route = _advance(router, state, "I have the pills ready")
    state.route = _advance(router, state, "turn 1")
    state.route = _advance(router, state, "turn 2")
    state.route = _advance(router, state, "turn 3")
    assert state.route == Route.SAFE_MODE

    state.route = _advance(router, state, "actually I want to kill myself")

    assert state.route == Route.QUARANTINE
    assert state.recovery_counters["safe_streak"] == 0


def test_safe_turns_do_not_advance_route_until_window_elapses():
    router = Router()
    state = EState(session_id="s", route=Route.NORMAL)

    route = router.decide(state, "just a normal message")

    assert route == Route.NORMAL


def test_consent_gate_persists_without_explicit_consent():
    router = Router()
    state = EState(session_id="s", route=Route.NORMAL, consent=ConsentLevel.NONE)
    state.route = _advance(router, state, "I was molested")
    assert state.route == Route.CONSENT_GATE

    state.route = _advance(router, state, "I don't want to talk about that yet")

    assert state.route == Route.CONSENT_GATE
