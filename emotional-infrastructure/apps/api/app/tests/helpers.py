from __future__ import annotations


def make_context(nonce: str = "nonce-1") -> dict:
    return {
        "ts": "2026-07-03T12:00:00Z",
        "channel": "text",
        "features": ["tempo"],
        "processor": "on_device",
        "purpose": "wellbeing_support",
        "retention": "session_only",
        "jurisdiction": "US-CA",
        "ui_copy_id": "ui-001",
        "nonce": nonce,
    }
