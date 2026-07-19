"""Shared Pydantic schemas used by more than one module.

Module-specific request/response schemas live in each module's own
schemas.py; this file only holds cross-cutting types (context envelope,
ledger event shape) referenced from multiple modules.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

Channel = Literal["voice", "text", "video"]


class ContextEnvelope(BaseModel):
    """The CTP context envelope. Must contain no PII (enforced by callers
    only submitting structural/operational metadata, never raw content)."""

    ts: str
    channel: Channel
    features: list[str] = Field(default_factory=list)
    processor: str
    purpose: str
    retention: str
    jurisdiction: str
    ui_copy_id: str
    nonce: str


class LedgerEventOut(BaseModel):
    event_id: str
    sequence: int
    timestamp: datetime
    ctid_reference: str | None = None
    jti: str | None = None
    sub: str | None = None
    signal_category: str | None = None
    inference_label: str | None = None
    pdev_action: str | None = None
    decision: str
    policy_version: str
    context_hash: str | None = None
    previous_block_hash: str
    block_hash: str
    hmac_signature: str | None = None
    event_metadata: dict[str, Any] = Field(default_factory=dict)

    model_config = {"from_attributes": True}
