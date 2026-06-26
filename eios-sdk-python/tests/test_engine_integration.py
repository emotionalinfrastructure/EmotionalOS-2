import pytest

from eios.core.config import get_tier1_config
from eios.core.engine import EIOSEngine
from eios.core.estate import ConsentLevel
from eios.core.policy import HELPLINE_TEXT


def test_quarantine_returns_helpline_response():
    engine = EIOSEngine(system_id="test-system")

    result = engine.process_interaction("s1", "I have the pills ready")

    assert result["route"] == "QUARANTINE"
    assert result["response"] == HELPLINE_TEXT
    assert result["violations"] == []


def test_consent_gate_blocks_until_explicit_consent():
    engine = EIOSEngine(system_id="test-system")

    gated = engine.process_interaction("s1", "I was abused as a child")
    assert gated["route"] == "CONSENT_GATE"
    assert "consent" in gated["response"].lower()

    cleared = engine.process_interaction("s1", "yes, I consent", consent=ConsentLevel.EXPLICIT)
    assert cleared["route"] == "NORMAL"


def test_process_interaction_accepts_explicit_agency_override():
    engine = EIOSEngine(system_id="test-system")

    result = engine.process_interaction("s1", "hello", agency=0.9)

    assert result["metrics"]["delta_A"] == pytest.approx(0.4)


def test_default_responder_used_for_normal_route():
    engine = EIOSEngine(system_id="test-system")

    result = engine.process_interaction("s1", "just saying hi")

    assert result["route"] == "NORMAL"
    assert "just saying hi" in result["response"]


def test_custom_responder_is_used_for_normal_route():
    def responder(text, state, route):
        return f"custom:{text}"

    engine = EIOSEngine(system_id="test-system", responder=responder)

    result = engine.process_interaction("s1", "hello there")

    assert result["response"] == "custom:hello there"


def test_each_session_tracks_independent_state():
    engine = EIOSEngine(system_id="test-system")

    engine.process_interaction("s1", "I have the pills ready")
    other = engine.process_interaction("s2", "just saying hi")

    assert other["route"] == "NORMAL"


def test_ledger_entry_and_metrics_attached_to_result():
    engine = EIOSEngine(system_id="test-system")

    result = engine.process_interaction("s1", "hello")

    assert "hmac_sha256" in result["ledger_entry"]
    assert set(result["metrics"]) == {"NAS", "delta_A", "REI", "EVI", "CIS"}


def test_from_config_uses_config_system_id_and_tier():
    config = get_tier1_config("clinic-bot")
    engine = EIOSEngine.from_config(config, responder=lambda text, state, route: "ok")

    assert engine.system_id == "clinic-bot"
    assert engine.certification_tier == "Tier1"
