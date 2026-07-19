from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class LedgerEventCreate(BaseModel):
    decision: str
    policy_version: str
    ctid_reference: str | None = None
    jti: str | None = None
    sub: str | None = None
    signal_category: str | None = None
    inference_label: str | None = None
    pdev_action: str | None = None
    context_hash: str | None = None
    event_metadata: dict[str, Any] = Field(default_factory=dict)


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


class LedgerVerifyResult(BaseModel):
    valid: bool
    events_checked: int
    first_invalid_event_id: str | None = None
    reason: str | None = None
