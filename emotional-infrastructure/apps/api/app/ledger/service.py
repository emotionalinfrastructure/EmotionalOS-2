"""Dignity Ledger: append-only, hash-chained governance decision log.

Every governance module (CTP, PDEV, EGL, TAR, Trajectory) calls
``append_event`` directly (not over HTTP) so that a single decision and its
ledger entry are written in the same database transaction. The ledger never
stores raw message content or raw emotional content -- only the metadata
fields defined in the implementation spec.
"""
from __future__ import annotations

import csv
import io
import json
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import DignityLedgerEvent
from app.security.hashing import canonicalize_json, hmac_sha256_hex, sha256_hex

GENESIS_HASH = "0" * 64


def _payload_for_hash(
    *,
    event_id: str,
    timestamp: str,
    ctid_reference: str | None,
    jti: str | None,
    sub: str | None,
    signal_category: str | None,
    inference_label: str | None,
    pdev_action: str | None,
    decision: str,
    policy_version: str,
    context_hash: str | None,
    previous_block_hash: str,
    event_metadata: dict[str, Any],
) -> dict[str, Any]:
    """The exact field set that is hashed. Reconstructed identically by
    ``verify_chain`` from stored columns, so every event's hash is
    reproducible from stored fields alone."""
    return {
        "event_id": event_id,
        "timestamp": timestamp,
        "ctid_reference": ctid_reference,
        "jti": jti,
        "sub": sub,
        "signal_category": signal_category,
        "inference_label": inference_label,
        "pdev_action": pdev_action,
        "decision": decision,
        "policy_version": policy_version,
        "context_hash": context_hash,
        "previous_block_hash": previous_block_hash,
        "event_metadata": event_metadata,
    }


def _latest_event(db: Session) -> DignityLedgerEvent | None:
    return db.execute(
        select(DignityLedgerEvent).order_by(DignityLedgerEvent.sequence.desc()).limit(1)
    ).scalars().first()


def append_event(
    db: Session,
    *,
    decision: str,
    policy_version: str,
    ctid_reference: str | None = None,
    jti: str | None = None,
    sub: str | None = None,
    signal_category: str | None = None,
    inference_label: str | None = None,
    pdev_action: str | None = None,
    context_hash: str | None = None,
    event_metadata: dict[str, Any] | None = None,
) -> DignityLedgerEvent:
    event_metadata = event_metadata or {}
    event_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc)
    timestamp_iso = timestamp.isoformat()
    latest = _latest_event(db)
    previous_block_hash = latest.block_hash if latest else GENESIS_HASH
    next_sequence = (latest.sequence + 1) if latest else 1

    payload = _payload_for_hash(
        event_id=event_id,
        timestamp=timestamp_iso,
        ctid_reference=ctid_reference,
        jti=jti,
        sub=sub,
        signal_category=signal_category,
        inference_label=inference_label,
        pdev_action=pdev_action,
        decision=decision,
        policy_version=policy_version,
        context_hash=context_hash,
        previous_block_hash=previous_block_hash,
        event_metadata=event_metadata,
    )
    block_hash = sha256_hex(canonicalize_json(payload) + previous_block_hash)
    hmac_signature = hmac_sha256_hex(settings.ledger_hmac_secret, block_hash)

    row = DignityLedgerEvent(
        event_id=event_id,
        sequence=next_sequence,
        timestamp=timestamp,
        ctid_reference=ctid_reference,
        jti=jti,
        sub=sub,
        signal_category=signal_category,
        inference_label=inference_label,
        pdev_action=pdev_action,
        decision=decision,
        policy_version=policy_version,
        context_hash=context_hash,
        previous_block_hash=previous_block_hash,
        block_hash=block_hash,
        hmac_signature=hmac_signature,
        event_metadata=event_metadata,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def list_events(
    db: Session,
    *,
    sub: str | None = None,
    jti: str | None = None,
    decision: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[DignityLedgerEvent]:
    stmt = select(DignityLedgerEvent).order_by(DignityLedgerEvent.sequence.asc())
    if sub:
        stmt = stmt.where(DignityLedgerEvent.sub == sub)
    if jti:
        stmt = stmt.where(DignityLedgerEvent.jti == jti)
    if decision:
        stmt = stmt.where(DignityLedgerEvent.decision == decision)
    stmt = stmt.offset(offset).limit(limit)
    return list(db.execute(stmt).scalars().all())


def get_event(db: Session, event_id: str) -> DignityLedgerEvent | None:
    return db.get(DignityLedgerEvent, event_id)


def verify_chain(db: Session) -> dict[str, Any]:
    rows = list(db.execute(select(DignityLedgerEvent).order_by(DignityLedgerEvent.sequence.asc())).scalars().all())

    expected_previous = GENESIS_HASH
    for row in rows:
        if row.previous_block_hash != expected_previous:
            return {
                "valid": False,
                "events_checked": rows.index(row),
                "first_invalid_event_id": row.event_id,
                "reason": "previous_block_hash does not match prior event's block_hash",
            }

        payload = _payload_for_hash(
            event_id=row.event_id,
            timestamp=row.timestamp.isoformat(),
            ctid_reference=row.ctid_reference,
            jti=row.jti,
            sub=row.sub,
            signal_category=row.signal_category,
            inference_label=row.inference_label,
            pdev_action=row.pdev_action,
            decision=row.decision,
            policy_version=row.policy_version,
            context_hash=row.context_hash,
            previous_block_hash=row.previous_block_hash,
            event_metadata=row.event_metadata or {},
        )
        recomputed_block_hash = sha256_hex(canonicalize_json(payload) + row.previous_block_hash)
        if recomputed_block_hash != row.block_hash:
            return {
                "valid": False,
                "events_checked": rows.index(row) + 1,
                "first_invalid_event_id": row.event_id,
                "reason": "block_hash does not match recomputed hash of stored fields",
            }

        if row.hmac_signature:
            recomputed_hmac = hmac_sha256_hex(settings.ledger_hmac_secret, row.block_hash)
            if recomputed_hmac != row.hmac_signature:
                return {
                    "valid": False,
                    "events_checked": rows.index(row) + 1,
                    "first_invalid_event_id": row.event_id,
                    "reason": "hmac_signature does not match recomputed hmac",
                }

        expected_previous = row.block_hash

    return {"valid": True, "events_checked": len(rows), "first_invalid_event_id": None, "reason": None}


def export_json(db: Session) -> str:
    rows = list_events(db, limit=1_000_000)
    data = [
        {
            "event_id": r.event_id,
            "sequence": r.sequence,
            "timestamp": r.timestamp.isoformat(),
            "ctid_reference": r.ctid_reference,
            "jti": r.jti,
            "sub": r.sub,
            "signal_category": r.signal_category,
            "inference_label": r.inference_label,
            "pdev_action": r.pdev_action,
            "decision": r.decision,
            "policy_version": r.policy_version,
            "context_hash": r.context_hash,
            "previous_block_hash": r.previous_block_hash,
            "block_hash": r.block_hash,
            "hmac_signature": r.hmac_signature,
            "event_metadata": r.event_metadata,
        }
        for r in rows
    ]
    return json.dumps(data, indent=2)


def export_csv(db: Session) -> str:
    rows = list_events(db, limit=1_000_000)
    buffer = io.StringIO()
    fieldnames = [
        "event_id", "sequence", "timestamp", "ctid_reference", "jti", "sub",
        "signal_category", "inference_label", "pdev_action", "decision",
        "policy_version", "context_hash", "previous_block_hash", "block_hash",
        "hmac_signature", "event_metadata",
    ]
    writer = csv.DictWriter(buffer, fieldnames=fieldnames)
    writer.writeheader()
    for r in rows:
        writer.writerow({
            "event_id": r.event_id,
            "sequence": r.sequence,
            "timestamp": r.timestamp.isoformat(),
            "ctid_reference": r.ctid_reference or "",
            "jti": r.jti or "",
            "sub": r.sub or "",
            "signal_category": r.signal_category or "",
            "inference_label": r.inference_label or "",
            "pdev_action": r.pdev_action or "",
            "decision": r.decision,
            "policy_version": r.policy_version,
            "context_hash": r.context_hash or "",
            "previous_block_hash": r.previous_block_hash,
            "block_hash": r.block_hash,
            "hmac_signature": r.hmac_signature or "",
            "event_metadata": json.dumps(r.event_metadata or {}),
        })
    return buffer.getvalue()
