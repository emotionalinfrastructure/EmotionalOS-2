"""Unit tests for the EIOS Gateway prototype's routing logic.

Runs against the apps/api virtualenv (httpx + pytest already installed
there): `cd labs/eios-gateway && PYTHONPATH=. ../../apps/api/.venv/bin/python -m pytest tests/ -q`
"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path
from unittest.mock import AsyncMock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from gateway import ContextEnvelope, RouteRequest, route  # noqa: E402


def _context() -> ContextEnvelope:
    return ContextEnvelope(
        ts="2026-07-03T12:00:00Z",
        channel="text",
        features=["tempo"],
        processor="on_device",
        purpose="wellbeing_support",
        retention="session_only",
        jurisdiction="US-CA",
        ui_copy_id="ui-001",
        nonce="abc123",
    )


class _FakeResponse:
    def __init__(self, body: dict) -> None:
        self._body = body

    def json(self) -> dict:
        return self._body


class _FakeAsyncClient:
    def __init__(self, responses: dict[str, dict]) -> None:
        self._responses = responses

    async def __aenter__(self) -> "_FakeAsyncClient":
        return self

    async def __aexit__(self, *exc: object) -> None:
        return None

    async def post(self, path: str, json: dict) -> _FakeResponse:
        return _FakeResponse(self._responses[path])


def test_route_denies_when_ctp_validate_denies(monkeypatch):
    fake_client = _FakeAsyncClient({"/ctp/validate": {"decision": "deny", "reason": "expired"}})
    monkeypatch.setattr("gateway._get_client", AsyncMock(return_value=fake_client))

    req = RouteRequest(
        token="x", context=_context(), scope="signal.process", purpose="wellbeing_support",
        requested_feature="stabilization_prompt",
    )
    result = asyncio.run(route(req))
    assert result.routed is False
    assert "ctp_validate_denied" in result.reason


def test_route_denies_when_pdev_denies(monkeypatch):
    fake_client = _FakeAsyncClient({
        "/ctp/validate": {"decision": "allow", "claims": {"sub": "user-1"}},
        "/pdev/evaluate": {"decision": "deny", "reasons": ["purpose_not_approved"]},
    })
    monkeypatch.setattr("gateway._get_client", AsyncMock(return_value=fake_client))

    req = RouteRequest(
        token="x", context=_context(), scope="signal.process", purpose="wellbeing_support",
        requested_feature="stabilization_prompt",
    )
    result = asyncio.run(route(req))
    assert result.routed is False
    assert result.reason == "pdev_denied:deny"


def test_route_allows_and_forwards_when_both_allow(monkeypatch):
    fake_client = _FakeAsyncClient({
        "/ctp/validate": {"decision": "allow", "claims": {"sub": "user-1"}},
        "/pdev/evaluate": {"decision": "allow"},
    })
    monkeypatch.setattr("gateway._get_client", AsyncMock(return_value=fake_client))

    req = RouteRequest(
        token="x", context=_context(), scope="signal.process", purpose="wellbeing_support",
        requested_feature="stabilization_prompt", payload={"op": "tempo"},
    )
    result = asyncio.run(route(req))
    assert result.routed is True
    assert result.downstream_result == {"accepted": True, "operation": "stabilization_prompt", "echo": {"op": "tempo"}}
