from __future__ import annotations


def test_egl_tier3_hard_block(client):
    resp = client.post(
        "/egl/classify-signal",
        json={"sub": "user-1", "features": {"attachment_building_score": 0.9}},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["tier"] == 3
    assert body["decision"] == "deny"

    breaker_resp = client.post(
        "/egl/evaluate-circuit-breaker",
        json={
            "sub": "user-1",
            "cognitive_load": "high",
            "emotional_state": "distress_vulnerable",
            "action_risk": "irreversible",
        },
    )
    assert breaker_resp.status_code == 200
    assert breaker_resp.json()["breaker_action"] == "hard_block"


def test_egl_tier2_consent_step_up_required(client):
    classify_resp = client.post(
        "/egl/classify-signal",
        json={"sub": "user-1", "features": {"exhaustion_score": 0.8}},
    )
    body = classify_resp.json()
    assert body["tier"] == 2

    step_up_resp = client.post(
        "/egl/consent-step-up",
        json={
            "sub": "user-1",
            "tier": 2,
            "action_risk": "high",
            "confirmation_type": "typed_confirmation",
            "confirmed": False,
        },
    )
    assert step_up_resp.status_code == 200
    step_up_body = step_up_resp.json()
    assert step_up_body["required"] is True
    assert step_up_body["status"] == "pending"


def test_egl_tier2_consent_step_up_approved_when_confirmed(client):
    resp = client.post(
        "/egl/consent-step-up",
        json={
            "sub": "user-1",
            "tier": 2,
            "action_risk": "irreversible",
            "confirmation_type": "cooldown_delay",
            "confirmed": True,
        },
    )
    body = resp.json()
    assert body["status"] == "approved"


def test_egl_tier0_basal_state(client):
    resp = client.post("/egl/classify-signal", json={"sub": "user-1", "features": {}})
    body = resp.json()
    assert body["tier"] == 0
    assert body["decision"] == "allow"


def test_egl_circuit_breaker_sustain_when_stable(client):
    resp = client.post(
        "/egl/evaluate-circuit-breaker",
        json={
            "sub": "user-1",
            "cognitive_load": "low",
            "emotional_state": "stable_flow",
            "action_risk": "low",
        },
    )
    assert resp.json()["breaker_action"] == "sustain"
