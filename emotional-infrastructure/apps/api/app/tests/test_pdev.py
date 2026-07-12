from __future__ import annotations

from app.tests.helpers import make_context


def _issue(client):
    resp = client.post(
        "/ctp/issue",
        json={
            "sub": "user-1",
            "scope": "signal.process",
            "purpose": "wellbeing_support",
            "context": make_context(),
        },
    )
    assert resp.status_code == 201
    return resp.json()


def test_pdev_pass_allows(client):
    issued = _issue(client)
    resp = client.post(
        "/pdev/evaluate",
        json={
            "sub": "user-1",
            "purpose": "wellbeing_support",
            "requested_feature": "stabilization_prompt",
            "token": issued["token"],
            "context": make_context(),
            "signal_tier": 0,
            "action_risk": "low",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["decision"] == "allow"
    assert body["purpose"] == "pass"
    assert body["dignity"] == "pass"
    assert body["evidence"] == "pass"
    assert body["veto"] == "pass"
    assert body["ledger_event_id"]


def test_pdev_fail_no_token_denies(client):
    resp = client.post(
        "/pdev/evaluate",
        json={
            "sub": "user-1",
            "purpose": "wellbeing_support",
            "requested_feature": "stabilization_prompt",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["decision"] == "deny"
    assert body["evidence"] == "fail"
    assert "no_consent_token_presented" in body["reasons"]


def test_pdev_tier3_manipulation_denies(client):
    issued = _issue(client)
    resp = client.post(
        "/pdev/evaluate",
        json={
            "sub": "user-1",
            "purpose": "wellbeing_support",
            "requested_feature": "stabilization_prompt",
            "token": issued["token"],
            "context": make_context(),
            "signal_tier": 3,
            "action_risk": "low",
        },
    )
    body = resp.json()
    assert body["decision"] == "deny"
    assert body["dignity"] == "fail"


def test_pdev_step_up_required_review(client):
    issued = _issue(client)
    resp = client.post(
        "/pdev/evaluate",
        json={
            "sub": "user-1",
            "purpose": "wellbeing_support",
            "requested_feature": "stabilization_prompt",
            "token": issued["token"],
            "context": make_context(),
            "signal_tier": 2,
            "action_risk": "irreversible",
            "step_up_confirmed": False,
        },
    )
    body = resp.json()
    assert body["decision"] == "review_required"
    assert body["dignity"] == "fail"


def test_pdev_veto_requested(client):
    issued = _issue(client)
    resp = client.post(
        "/pdev/evaluate",
        json={
            "sub": "user-1",
            "purpose": "wellbeing_support",
            "requested_feature": "stabilization_prompt",
            "token": issued["token"],
            "context": make_context(),
            "veto_requested": True,
        },
    )
    body = resp.json()
    assert body["decision"] == "vetoed"
    assert body["veto"] == "fail"
