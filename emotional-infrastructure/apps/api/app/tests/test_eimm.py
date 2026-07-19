from __future__ import annotations


def test_eimm_levels_marks_4_and_5_aspirational(client):
    resp = client.get("/eimm/levels")
    assert resp.status_code == 200
    levels = {lvl["level"]: lvl for lvl in resp.json()["levels"]}
    assert levels[4]["aspirational_only"] is True
    assert levels[5]["aspirational_only"] is True
    assert levels[1]["aspirational_only"] is False


def test_eimm_assess_reactive_by_default(client):
    resp = client.post("/eimm/assess", json={"domain": "test", "criteria": {}})
    body = resp.json()
    assert body["maturity_level"] == 1
    assert body["certification_body_exists"] is False


def test_eimm_assess_managed_when_criteria_met(client):
    resp = client.post(
        "/eimm/assess",
        json={
            "domain": "test",
            "criteria": {
                "governance_documented": True,
                "signal_taxonomy_defined": True,
                "consent_protocol_implemented": True,
                "policy_engine_implemented": True,
                "audit_trail_implemented": True,
            },
        },
    )
    body = resp.json()
    assert body["maturity_level"] == 3
    assert body["level_name"] == "Managed"
    assert body["launch_gate_id"]


def test_eimm_assess_never_exceeds_criteria_gaps(client):
    resp = client.post(
        "/eimm/assess",
        json={
            "domain": "test",
            "criteria": {
                "governance_documented": True,
                "signal_taxonomy_defined": True,
                "consent_protocol_implemented": True,
                "policy_engine_implemented": True,
                "audit_trail_implemented": True,
                "automated_tests_passing": True,
                "external_audit_completed": False,
                "regulator_engagement": True,
                "standards_body_adoption": True,
                "movement_coalition_formed": True,
            },
        },
    )
    body = resp.json()
    assert body["maturity_level"] == 3
    assert "external_audit_completed" in body["missing_criteria"]
