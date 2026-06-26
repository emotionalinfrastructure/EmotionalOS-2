import base64

import pytest

from eios.core.engine import EIOSEngine
from eios.core.estate import ConsentLevel, EmotionVector, Metrics, Route
from eios.core.ledger import GENESIS_HASH, Ledger, bloom_test
from eios.tools.esc_auditor import full_replay_audit


def _metrics():
    return Metrics(nas=1.0, delta_a=0.0, rei=2.0, evi=0.0, cis=1.0)


def _emotion():
    return EmotionVector(intensity=5.0, valence=0.0, rumination_score=0.0)


def _dummy_responder(text, state, route):
    return "ok"


def test_append_chains_entries_via_prev_hash():
    ledger = Ledger()
    first = ledger.append("s1", "t0", Route.NORMAL, _metrics(), _emotion(), "hello", ConsentLevel.NONE, 0.5)
    second = ledger.append("s1", "t1", Route.NORMAL, _metrics(), _emotion(), "still here", ConsentLevel.NONE, 0.5)

    assert first["prev_hash"] == base64.b64encode(GENESIS_HASH).decode()
    assert second["prev_hash"] == first["hmac_sha256"]
    ledger.close()


def test_export_for_esc_audit_never_contains_plaintext():
    ledger = Ledger()
    ledger.append("s1", "t0", Route.NORMAL, _metrics(), _emotion(), "a secret diary entry", ConsentLevel.NONE, 0.5)
    export = ledger.export_for_esc_audit("s1")

    assert len(export) == 1
    assert "secret diary entry" not in repr(export[0])
    assert "text_sha256" in export[0]
    ledger.close()


def test_bloom_test_has_no_false_negatives_for_actual_tokens():
    ledger = Ledger()
    entry = ledger.append(
        "s1", "t0", Route.QUARANTINE, _metrics(), _emotion(), "I have the pills ready", ConsentLevel.NONE, 0.5
    )
    bits = base64.b64decode(entry["kw_bloom"])
    salt = base64.b64decode(entry["kw_bloom_salt"])

    assert bloom_test(bits, salt, "pills ready", entry["bloom_m"], entry["bloom_k"])
    ledger.close()


def test_full_replay_audit_clean_export_has_no_violations():
    engine = EIOSEngine(system_id="test-system", responder=_dummy_responder)
    engine.process_interaction("s1", "just checking in today")
    engine.process_interaction("s1", "feeling a bit better")

    export = engine.ledger.export_for_esc_audit("s1")

    assert full_replay_audit(export) == []


def test_full_replay_audit_detects_route_tampering_via_bloom():
    engine = EIOSEngine(system_id="test-system", responder=_dummy_responder)
    engine.process_interaction("s1", "I have the pills ready")

    export = engine.ledger.export_for_esc_audit("s1")
    export[0]["route_decided"] = "NORMAL"

    violations = full_replay_audit(export)

    assert any("CRITICAL" in v and "route mismatch" in v for v in violations)


def test_full_replay_audit_detects_hmac_tampering():
    engine = EIOSEngine(system_id="test-system", responder=_dummy_responder)
    engine.process_interaction("s1", "just checking in today")

    export = engine.ledger.export_for_esc_audit("s1")
    export[0]["agency"] = 0.9

    violations = full_replay_audit(export)

    assert any("hmac mismatch" in v for v in violations)


def test_full_replay_audit_detects_trauma_route_tampering_via_bloom():
    engine = EIOSEngine(system_id="test-system", responder=_dummy_responder)
    engine.process_interaction("s1", "I was abused as a child")

    export = engine.ledger.export_for_esc_audit("s1")
    export[0]["route_decided"] = "NORMAL"

    violations = full_replay_audit(export)

    assert any("trauma keyword present" in v for v in violations)


def test_ledger_uses_explicit_hmac_key_when_given():
    ledger = Ledger(hmac_key=b"0" * 32)

    entry = ledger.append("s1", "t0", Route.NORMAL, _metrics(), _emotion(), "hi", ConsentLevel.NONE, 0.5)

    assert "hmac_sha256" in entry
    ledger.close()


def test_ledger_requires_hmac_key_when_env_var_unset(monkeypatch):
    monkeypatch.delenv("EIOS_HMAC_KEY", raising=False)

    with pytest.raises(ValueError):
        Ledger()


def test_to_dicts_exports_all_sessions():
    ledger = Ledger()
    ledger.append("s1", "t0", Route.NORMAL, _metrics(), _emotion(), "hello", ConsentLevel.NONE, 0.5)
    ledger.append("s2", "t0", Route.NORMAL, _metrics(), _emotion(), "hi there", ConsentLevel.NONE, 0.5)

    all_entries = ledger.to_dicts()

    assert {e["session_id"] for e in all_entries} == {"s1", "s2"}
    ledger.close()


def test_full_replay_audit_detects_chain_break():
    engine = EIOSEngine(system_id="test-system", responder=_dummy_responder)
    engine.process_interaction("s1", "first message")
    engine.process_interaction("s1", "second message")

    export = engine.ledger.export_for_esc_audit("s1")
    export[0], export[1] = export[1], export[0]

    violations = full_replay_audit(export)

    assert any("chain break" in v for v in violations)
