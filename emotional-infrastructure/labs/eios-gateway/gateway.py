"""EIOS Gateway prototype.

A minimal routing/service wrapper that fronts a downstream "protected
resource" with real CTP + PDEV enforcement: no request reaches the
downstream operation unless CTP validation and the PDEV gates both allow
it. This is a lab prototype, not a production gateway (no rate limiting,
retries, or circuit breaking of its own) -- see labs/eios-gateway/README.md.

Run standalone against a running apps/api instance:

    EI_API_BASE_URL=http://localhost:8000 uvicorn gateway:app --port 8090
"""
from __future__ import annotations

import os
from typing import Any

import httpx
from fastapi import FastAPI
from pydantic import BaseModel, Field

EI_API_BASE_URL = os.environ.get("EI_API_BASE_URL", "http://localhost:8000")

app = FastAPI(
    title="EIOS Gateway (lab prototype)",
    description="Routes requests to a downstream operation only after CTP + PDEV both allow them.",
)


class ContextEnvelope(BaseModel):
    ts: str
    channel: str
    features: list[str] = Field(default_factory=list)
    processor: str
    purpose: str
    retention: str
    jurisdiction: str
    ui_copy_id: str
    nonce: str


class RouteRequest(BaseModel):
    token: str
    context: ContextEnvelope
    scope: str
    purpose: str
    requested_feature: str
    payload: dict[str, Any] = Field(default_factory=dict)


class RouteResponse(BaseModel):
    routed: bool
    reason: str
    ctp_decision: str | None = None
    pdev_decision: str | None = None
    downstream_result: dict[str, Any] | None = None


async def _get_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(base_url=EI_API_BASE_URL, timeout=10.0)


async def route(req: RouteRequest) -> RouteResponse:
    """Core gateway logic, exposed as a plain function so it is directly
    unit-testable without spinning up an HTTP server."""
    async with await _get_client() as client:
        validate_resp = await client.post(
            "/ctp/validate",
            json={"token": req.token, "context": req.context.model_dump()},
        )
        validate_body = validate_resp.json()
        if validate_body.get("decision") != "allow":
            return RouteResponse(
                routed=False,
                reason=f"ctp_validate_denied:{validate_body.get('reason')}",
                ctp_decision=validate_body.get("decision"),
            )

        sub = (validate_body.get("claims") or {}).get("sub", "unknown")

        pdev_resp = await client.post(
            "/pdev/evaluate",
            json={
                "sub": sub,
                "purpose": req.purpose,
                "requested_feature": req.requested_feature,
                "token": req.token,
                "context": req.context.model_dump(),
            },
        )
        pdev_body = pdev_resp.json()
        if pdev_body.get("decision") != "allow":
            return RouteResponse(
                routed=False,
                reason=f"pdev_denied:{pdev_body.get('decision')}",
                ctp_decision=validate_body.get("decision"),
                pdev_decision=pdev_body.get("decision"),
            )

    # Only reached if both CTP and PDEV allowed the request. A real
    # deployment would forward `req.payload` to the actual downstream
    # service here; this lab prototype returns a real, deterministic
    # acknowledgement instead of a fake response.
    downstream_result = {
        "accepted": True,
        "operation": req.requested_feature,
        "echo": req.payload,
    }

    return RouteResponse(
        routed=True,
        reason="ok",
        ctp_decision="allow",
        pdev_decision="allow",
        downstream_result=downstream_result,
    )


@app.post("/gateway/route", response_model=RouteResponse)
async def route_endpoint(req: RouteRequest) -> RouteResponse:
    return await route(req)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "eios-gateway-lab-prototype", "upstream": EI_API_BASE_URL}
