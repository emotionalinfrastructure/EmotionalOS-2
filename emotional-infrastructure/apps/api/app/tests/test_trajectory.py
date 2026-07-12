from __future__ import annotations


def _event(event_type: str, actor: str, ts: str) -> dict:
    return {"type": event_type, "actor": actor, "ts": ts}


def test_trajectory_insufficient_data(client):
    resp = client.post(
        "/trajectory/evaluate",
        json={
            "domain": "wellbeing",
            "time_window": "7d",
            "support_mode": "companion",
            "system_events": [_event("check_in", "system", "2026-07-01T00:00:00Z")],
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["trajectory_status"] == "insufficient_data"
    assert all(v == "unknown" for v in body["legitimacy_conditions"].values())
    assert body["recommended_action"] == "continue"


def test_trajectory_substitution_warning(client):
    events = [_event("task_substitution", "system", f"2026-07-0{i}T00:00:00Z") for i in range(1, 7)]
    events.append(_event("recommendation", "system", "2026-07-07T00:00:00Z"))
    resp = client.post(
        "/trajectory/evaluate",
        json={
            "domain": "wellbeing",
            "time_window": "7d",
            "support_mode": "companion",
            "system_events": events,
            "interaction_pattern_summary": {"centrality_trend": "increasing"},
        },
    )
    body = resp.json()
    assert body["trajectory_status"] == "substitution"
    assert body["recommended_action"] == "block_escalation"


def test_trajectory_stable_support(client):
    events = [_event("check_in", "user", f"2026-07-0{i}T00:00:00Z") for i in range(1, 6)]
    resp = client.post(
        "/trajectory/evaluate",
        json={
            "domain": "wellbeing",
            "time_window": "7d",
            "support_mode": "companion",
            "system_events": events,
            "interaction_pattern_summary": {"centrality_trend": "decreasing"},
        },
    )
    body = resp.json()
    assert body["trajectory_status"] == "stable_support"
    assert body["legitimacy_conditions"]["attenuation"] == "pass"


def test_trajectory_list_and_get(client):
    client.post(
        "/trajectory/evaluate",
        json={
            "domain": "wellbeing",
            "time_window": "7d",
            "support_mode": "companion",
            "system_events": [_event("check_in", "user", "2026-07-01T00:00:00Z")] * 5,
        },
    )
    listing = client.get("/trajectory/evaluations")
    assert listing.status_code == 200
    assert len(listing.json()) >= 1

    eval_id = listing.json()[0]["id"]
    single = client.get(f"/trajectory/evaluations/{eval_id}")
    assert single.status_code == 200
