"""
Integration tests for the EIOS Gateway HTTP API.

Each test uses a unique session_id so the module-level EIOSGateway instance
(which holds per-session EState) doesn't bleed state between tests.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

_BASE = {
    "user_id": "u1",
    "text": "just checking in",
    "emotion_intensity": 5.0,
    "negative_valence": False,
    "suicidality": False,
    "trauma_markers": False,
    "consent_level": "surface",
    "tier": 1,
}


def _req(**overrides):
    return {**_BASE, **overrides}


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

def test_health_returns_ok():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
    assert resp.json()["version"] == "1.0.1"


# ---------------------------------------------------------------------------
# /process — normal interaction
# ---------------------------------------------------------------------------

def test_process_normal_message_returns_normal_route():
    resp = client.post("/process", json=_req(session_id="s-normal-01"))
    assert resp.status_code == 200
    data = resp.json()
    assert data["route"] == "NORMAL"
    assert data["depth_policy"] == "full"
    assert "model_response" in data


def test_process_returns_all_metric_keys():
    resp = client.post("/process", json=_req(session_id="s-metrics-01"))
    metrics = resp.json()["metrics"]
    assert set(metrics) >= {"nas", "rei", "evi", "cis", "deltaA"}


def test_process_returns_ledger_entry_with_hmac():
    resp = client.post("/process", json=_req(session_id="s-ledger-01"))
    assert "hmac_sha256" in resp.json()["ledger_entry"]


# ---------------------------------------------------------------------------
# /process — safety triggers
# ---------------------------------------------------------------------------

def test_process_suicidal_phrase_triggers_quarantine():
    resp = client.post(
        "/process",
        json=_req(session_id="s-crisis-01", text="I have the pills ready"),
    )
    data = resp.json()
    assert data["route"] == "QUARANTINE"
    assert data["depth_policy"] == "crisis_protocol"
    assert "988" in data["model_response"]


def test_process_trauma_without_consent_triggers_consent_gate():
    resp = client.post(
        "/process",
        json=_req(session_id="s-trauma-01", text="I was abused as a child"),
    )
    data = resp.json()
    assert data["route"] == "CONSENT_GATE"
    assert data["depth_policy"] == "consent_required"


def test_process_trauma_with_explicit_consent_does_not_gate():
    resp = client.post(
        "/process",
        json=_req(
            session_id="s-trauma-ok-01",
            text="I was abused as a child",
            consent_level="trauma",
        ),
    )
    assert resp.json()["route"] == "NORMAL"


def test_process_negative_valence_propagates_to_metrics():
    resp = client.post(
        "/process",
        json=_req(session_id="s-valence-01", negative_valence=True, emotion_intensity=7.0),
    )
    assert resp.status_code == 200


# ---------------------------------------------------------------------------
# /process — session independence
# ---------------------------------------------------------------------------

def test_separate_sessions_have_independent_routes():
    client.post("/process", json=_req(session_id="s-indep-crisis", text="I have the pills ready"))
    resp = client.post("/process", json=_req(session_id="s-indep-ok-01"))
    assert resp.json()["route"] == "NORMAL"


# ---------------------------------------------------------------------------
# /process — validation
# ---------------------------------------------------------------------------

def test_process_rejects_invalid_consent_level():
    resp = client.post("/process", json=_req(session_id="s-val-01", consent_level="deep"))
    assert resp.status_code == 422


def test_process_rejects_out_of_range_intensity():
    resp = client.post("/process", json=_req(session_id="s-val-02", emotion_intensity=11.0))
    assert resp.status_code == 422


def test_process_rejects_missing_required_fields():
    resp = client.post("/process", json={"session_id": "s-val-03"})
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# /ledger
# ---------------------------------------------------------------------------

def test_ledger_all_returns_entries_after_processing():
    client.post("/process", json=_req(session_id="s-led-all-01"))
    resp = client.get("/ledger")
    assert resp.status_code == 200
    entries = resp.json()["entries"]
    assert any(e["session_id"] == "s-led-all-01" for e in entries)


def test_ledger_session_filters_by_session_id():
    client.post("/process", json=_req(session_id="s-led-filter-01"))
    client.post("/process", json=_req(session_id="s-led-filter-02"))

    resp = client.get("/ledger/s-led-filter-01")
    entries = resp.json()["entries"]
    assert all(e["session_id"] == "s-led-filter-01" for e in entries)
    assert len(entries) >= 1


def test_ledger_session_returns_empty_for_unknown_session():
    resp = client.get("/ledger/nonexistent-session-xyz")
    assert resp.json()["entries"] == []
