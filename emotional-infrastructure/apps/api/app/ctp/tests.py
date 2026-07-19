"""CTP (Consent Token Protocol) tests.

Covers the required backend coverage from the implementation spec: valid
token allows, expired/revoked/malformed tokens deny, and context/scope/
purpose mismatches deny with the correct HTTP status codes.
"""
from __future__ import annotations

import time
import uuid

from app.config import settings
from app.security.hashing import canonicalize_json, sha256_hex
from app.security.jwt_service import sign_claims
from app.tests.helpers import make_context


def _issue(client, **overrides):
    payload = {
        "sub": "user-1",
        "scope": "signal.process",
        "purpose": "wellbeing_support",
        "context": make_context(),
    }
    payload.update(overrides)
    resp = client.post("/ctp/issue", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_valid_token_allows(client):
    issued = _issue(client)
    resp = client.post(
        "/ctp/validate",
        json={"token": issued["token"], "context": make_context()},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["decision"] == "allow"
    assert body["claims"]["jti"] == issued["jti"]


def test_expired_token_denies(client):
    now = int(time.time())
    claims = {
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "sub": "user-1",
        "iat": now - 600,
        "exp": now - 300,
        "jti": str(uuid.uuid4()),
        "scope": "signal.process",
        "purpose": "wellbeing_support",
        "context_hash": sha256_hex(canonicalize_json(make_context())),
        "policy_uri": settings.policy_uri_default,
        "consent_level": "standard",
        "consent_version": settings.consent_version,
    }
    expired_token = sign_claims(claims)
    resp = client.post("/ctp/validate", json={"token": expired_token, "context": make_context()})
    assert resp.status_code == 401
    assert resp.json()["decision"] == "deny"
    assert resp.json()["reason"] == "expired"


def test_revoked_token_denies(client):
    issued = _issue(client)
    revoke_resp = client.post("/ctp/revoke", json={"jti": issued["jti"], "reason": "test"})
    assert revoke_resp.status_code == 200
    assert revoke_resp.json()["revoked"] is True

    resp = client.post("/ctp/validate", json={"token": issued["token"], "context": make_context()})
    assert resp.status_code == 401
    assert resp.json()["reason"] == "revoked"


def test_malformed_token_denies(client):
    resp = client.post("/ctp/validate", json={"token": "not-a-jwt", "context": make_context()})
    assert resp.status_code == 401
    assert resp.json()["decision"] == "deny"


def test_context_hash_mismatch_denies(client):
    issued = _issue(client)
    resp = client.post(
        "/ctp/validate",
        json={"token": issued["token"], "context": make_context(nonce="tampered-nonce")},
    )
    assert resp.status_code == 400
    assert resp.json()["reason"] == "context_mismatch"


def test_scope_mismatch_denies(client):
    issued = _issue(client)
    resp = client.post(
        "/ctp/validate",
        json={
            "token": issued["token"],
            "context": make_context(),
            "expected_scope": "some.other.scope",
        },
    )
    assert resp.status_code == 403
    assert resp.json()["reason"] == "scope_mismatch"


def test_purpose_mismatch_denies(client):
    issued = _issue(client)
    resp = client.post(
        "/ctp/validate",
        json={
            "token": issued["token"],
            "context": make_context(),
            "expected_purpose": "unrelated_purpose",
        },
    )
    assert resp.status_code == 403
    assert resp.json()["reason"] == "purpose_mismatch"


def test_process_blocks_without_valid_consent(client):
    resp = client.post(
        "/ctp/process",
        json={
            "token": "not-a-jwt",
            "context": make_context(),
            "scope": "signal.process",
            "purpose": "wellbeing_support",
            "payload_descriptor": {"operation": "tempo_adjustment"},
        },
    )
    assert resp.status_code == 401
    assert resp.json()["decision"] == "deny"


def test_process_allows_with_valid_consent(client):
    issued = _issue(client)
    resp = client.post(
        "/ctp/process",
        json={
            "token": issued["token"],
            "context": make_context(),
            "scope": "signal.process",
            "purpose": "wellbeing_support",
            "payload_descriptor": {"operation": "tempo_adjustment"},
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["decision"] == "allow"
    assert body["process_id"]


def test_crl_lists_revoked_jti(client):
    issued = _issue(client)
    client.post("/ctp/revoke", json={"jti": issued["jti"], "reason": "test"})
    resp = client.get("/ctp/crl")
    assert resp.status_code == 200
    jtis = [entry["jti"] for entry in resp.json()]
    assert issued["jti"] in jtis


def test_introspect_reports_active_state(client):
    issued = _issue(client)
    resp = client.post("/ctp/introspect", json={"token": issued["token"]})
    assert resp.status_code == 200
    body = resp.json()
    assert body["active"] is True
    assert body["revoked"] is False
