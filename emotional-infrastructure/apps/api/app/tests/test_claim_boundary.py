from __future__ import annotations


def test_claim_scan_flags_restricted_terms(client):
    resp = client.post(
        "/claim-boundary/scan",
        json={"text": "This governance runtime is fully certified and production-ready.", "source_label": "test"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["passed"] is False
    terms = {f["term"] for f in body["flagged_terms"]}
    assert "certified" in terms
    assert "production-ready" in terms
    assert body["suggestions"]


def test_claim_scan_passes_clean_text(client):
    resp = client.post(
        "/claim-boundary/scan",
        json={"text": "This is a candidate architecture and reference implementation.", "source_label": "test"},
    )
    body = resp.json()
    assert body["passed"] is True
    assert body["flagged_terms"] == []


def test_claim_boundary_rules_endpoint(client):
    resp = client.get("/claim-boundary/rules")
    assert resp.status_code == 200
    body = resp.json()
    assert "certified" in body["restricted_phrases"]
    assert body["replacement_map"]["certified"]
