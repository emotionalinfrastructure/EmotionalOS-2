from __future__ import annotations


def test_default_rules_seeded(client):
    resp = client.get("/policy/rules")
    assert resp.status_code == 200
    names = {r["name"] for r in resp.json()}
    assert "deny_revoked_token" in names
    assert "allow_tier0_ordinary_processing" in names


def test_policy_evaluate_denies_missing_token(client):
    resp = client.post("/policy/evaluate", json={"token_present": False})
    body = resp.json()
    assert body["decision"] == "deny"
    assert body["matched_rule"] == "deny_missing_or_invalid_consent"


def test_policy_evaluate_denies_tier3(client):
    resp = client.post(
        "/policy/evaluate",
        json={"token_present": True, "token_valid": True, "signal_tier": 3},
    )
    body = resp.json()
    assert body["decision"] == "deny"
    assert body["matched_rule"] == "deny_tier3_manipulation"


def test_policy_evaluate_allows_tier0(client):
    resp = client.post(
        "/policy/evaluate",
        json={"token_present": True, "token_valid": True, "signal_tier": 0},
    )
    body = resp.json()
    assert body["decision"] == "allow"
    assert body["matched_rule"] == "allow_tier0_ordinary_processing"


def test_policy_create_and_patch_rule(client):
    create_resp = client.post(
        "/policy/rules",
        json={
            "name": "custom_test_rule",
            "description": "test rule",
            "condition": {"field": "sub", "equals": "special-user"},
            "decision": "review_required",
            "priority": 5,
        },
    )
    assert create_resp.status_code == 201
    rule_id = create_resp.json()["id"]

    patch_resp = client.patch(f"/policy/rules/{rule_id}", json={"active": False})
    assert patch_resp.status_code == 200
    assert patch_resp.json()["active"] is False
    assert patch_resp.json()["version"] == 2
