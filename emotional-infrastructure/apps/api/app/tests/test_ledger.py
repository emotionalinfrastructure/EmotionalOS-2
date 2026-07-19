from __future__ import annotations

from app.ledger import service as ledger_service
from app.models import DignityLedgerEvent


def test_ledger_append_via_api(client):
    resp = client.post(
        "/ledger/events",
        json={"decision": "allow", "policy_version": "v1", "sub": "user-1", "pdev_action": "manual_test"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["sequence"] == 1
    assert body["previous_block_hash"] == "0" * 64
    assert len(body["block_hash"]) == 64


def test_ledger_chain_continuity(client):
    client.post("/ledger/events", json={"decision": "allow", "policy_version": "v1", "sub": "a"})
    resp2 = client.post("/ledger/events", json={"decision": "deny", "policy_version": "v1", "sub": "b"})
    events = client.get("/ledger/events").json()
    assert len(events) == 2
    assert events[1]["previous_block_hash"] == events[0]["block_hash"]
    assert resp2.json()["sequence"] == 2


def test_ledger_verify_passes_on_untouched_chain(client):
    for i in range(5):
        client.post("/ledger/events", json={"decision": "allow", "policy_version": "v1", "sub": f"user-{i}"})
    resp = client.get("/ledger/verify")
    body = resp.json()
    assert body["valid"] is True
    assert body["events_checked"] == 5


def test_ledger_verify_detects_tampering(client, db_session):
    client.post("/ledger/events", json={"decision": "allow", "policy_version": "v1", "sub": "user-1"})
    client.post("/ledger/events", json={"decision": "allow", "policy_version": "v1", "sub": "user-2"})

    row = db_session.query(DignityLedgerEvent).filter_by(sequence=1).one()
    row.decision = "deny"
    db_session.commit()

    resp = client.get("/ledger/verify")
    body = resp.json()
    assert body["valid"] is False
    assert body["first_invalid_event_id"] == row.event_id


def test_ledger_export_json_and_csv(client):
    client.post("/ledger/events", json={"decision": "allow", "policy_version": "v1", "sub": "user-1"})
    json_resp = client.get("/ledger/export.json")
    assert json_resp.status_code == 200
    assert "user-1" in json_resp.text

    csv_resp = client.get("/ledger/export.csv")
    assert csv_resp.status_code == 200
    assert "event_id" in csv_resp.text.splitlines()[0]


def test_ledger_event_reproducible_from_stored_fields(db_session):
    event = ledger_service.append_event(
        db_session, decision="allow", policy_version="v1", sub="user-1", pdev_action="test"
    )
    result = ledger_service.verify_chain(db_session)
    assert result["valid"] is True
    assert event.block_hash != ""
