"""Canonicalization and hashing helpers used across CTP, PDEV, and the ledger.

The Dignity Ledger and the CTP context-binding rules both depend on a single
deterministic canonical-JSON representation, so this is implemented once and
imported everywhere instead of re-derived per module.
"""
from __future__ import annotations

import hashlib
import hmac
import json
from typing import Any


def canonicalize_json(value: Any) -> str:
    """Canonical JSON: sorted keys, no insignificant whitespace, UTF-8 safe."""
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha256_hex(data: str | bytes) -> str:
    if isinstance(data, str):
        data = data.encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def context_hash(context_envelope: dict) -> str:
    return sha256_hex(canonicalize_json(context_envelope))


def hmac_sha256_hex(secret: str, message: str) -> str:
    return hmac.new(secret.encode("utf-8"), message.encode("utf-8"), hashlib.sha256).hexdigest()
