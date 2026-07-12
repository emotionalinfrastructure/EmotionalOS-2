from __future__ import annotations

import time


def _authorize(client, ttl_seconds=300, action_risk="medium", escalation_allowed=False):
    resp = client.post(
        "/tar/authorize",
        json={
            "sub": "user-1",
            "inference_ref": "inf-ref-1",
            "authorized_action": "send_checkin",
            "action_risk": action_risk,
            "ttl_seconds": ttl_seconds,
            "escalation_allowed": escalation_allowed,
        },
    )
    assert resp.status_code == 201
    return resp.json()


def test_tar_within_scope_allows(client):
    auth = _authorize(client)
    resp = client.post(
        "/tar/evaluate",
        json={"authorization_id": auth["id"], "requested_action_risk": "medium"},
    )
    body = resp.json()
    assert body["decision"] == "allow"
    assert body["valid_now"] is True


def test_tar_expired_authorization_denies(client):
    auth = _authorize(client, ttl_seconds=1)
    time.sleep(1.5)
    resp = client.post(
        "/tar/evaluate",
        json={"authorization_id": auth["id"], "requested_action_risk": "medium"},
    )
    body = resp.json()
    assert body["decision"] == "expired"
    assert body["valid_now"] is False
    assert body["reauthorization_required"] is True


def test_tar_reauthorization_required_on_risk_escalation(client):
    auth = _authorize(client, action_risk="low", escalation_allowed=False)
    resp = client.post(
        "/tar/evaluate",
        json={"authorization_id": auth["id"], "requested_action_risk": "irreversible"},
    )
    body = resp.json()
    assert body["decision"] == "reauthorization_required"
    assert body["reauthorization_required"] is True


def test_tar_escalation_allowed_requires_review_not_reauth(client):
    auth = _authorize(client, action_risk="low", escalation_allowed=True)
    resp = client.post(
        "/tar/evaluate",
        json={
            "authorization_id": auth["id"],
            "requested_action_risk": "high",
            "requested_escalation": True,
        },
    )
    body = resp.json()
    assert body["decision"] == "review_required"


def test_tar_manual_expire(client):
    auth = _authorize(client)
    resp = client.post("/tar/expire", json={"authorization_id": auth["id"], "reason": "manual"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "expired"

    fetched = client.get(f"/tar/authorizations/{auth['id']}")
    assert fetched.json()["status"] == "expired"


def test_tar_unknown_authorization_denies(client):
    resp = client.post(
        "/tar/evaluate",
        json={"authorization_id": "does-not-exist", "requested_action_risk": "low"},
    )
    body = resp.json()
    assert body["decision"] == "deny"
