from __future__ import annotations


def test_signals_taxonomy_lists_all_codes(client):
    resp = client.get("/signals/taxonomy")
    assert resp.status_code == 200
    codes = {entry["code"] for entry in resp.json()["entries"]}
    assert codes == {
        "K-01", "K-02", "K-03", "K-04",
        "L-01", "L-02", "L-03", "L-04",
        "T-01", "T-02", "T-03", "T-04",
    }


def test_signals_evaluate_maps_to_risk_tier(client):
    resp = client.post("/signals/evaluate", json={"sub": "user-1", "code": "K-01", "value": 0.9})
    assert resp.status_code == 200
    body = resp.json()
    assert body["governance_risk_tier"] == 2
    assert body["ledger_event_id"]


def test_signals_evaluate_low_value_is_tier0(client):
    resp = client.post("/signals/evaluate", json={"sub": "user-1", "code": "T-04", "value": 0.1})
    assert resp.json()["governance_risk_tier"] == 0
