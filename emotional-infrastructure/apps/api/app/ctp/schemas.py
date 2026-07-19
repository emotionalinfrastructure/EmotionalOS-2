from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.schemas import ContextEnvelope


class IssueRequest(BaseModel):
    sub: str
    scope: str
    purpose: str
    consent_level: str = "standard"
    context: ContextEnvelope
    ttl_seconds: int | None = Field(default=None, description="Requested lifetime; capped at 300s.")


class IssueResponse(BaseModel):
    token: str
    jti: str
    sub: str
    scope: str
    purpose: str
    context_hash: str
    policy_uri: str
    consent_level: str
    consent_version: str
    issued_at: datetime
    expires_at: datetime
    ledger_event_id: str


class ValidateRequest(BaseModel):
    token: str
    context: ContextEnvelope
    expected_scope: str | None = None
    expected_purpose: str | None = None


class ValidateResponse(BaseModel):
    decision: str
    reason: str
    claims: dict[str, Any] | None = None
    ledger_event_id: str | None = None


class RevokeRequest(BaseModel):
    jti: str
    reason: str = "revoked_by_holder"


class RevokeResponse(BaseModel):
    jti: str
    revoked: bool
    ledger_event_id: str | None = None


class IntrospectRequest(BaseModel):
    token: str


class IntrospectResponse(BaseModel):
    active: bool
    expired: bool
    revoked: bool
    claims: dict[str, Any] | None = None


class CRLEntry(BaseModel):
    jti: str
    revoked_at: datetime
    reason: str


class ProcessRequest(BaseModel):
    token: str
    context: ContextEnvelope
    scope: str
    purpose: str
    payload_descriptor: dict[str, Any] = Field(default_factory=dict)


class ProcessResponse(BaseModel):
    decision: str
    reason: str
    process_id: str | None = None
    processed_at: datetime | None = None
    result: dict[str, Any] | None = None
    ledger_event_id: str | None = None
