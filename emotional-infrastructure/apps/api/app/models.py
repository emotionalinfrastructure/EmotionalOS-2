"""SQLAlchemy ORM models for the Emotional Infrastructure governance runtime.

Every table here backs a real governance decision. Nothing in this module
is a placeholder: rows written to these tables are what the API endpoints
return and what the Dignity Ledger hash-chains.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class ConsentRecord(Base):
    """A user's standing consent grant, independent of any single token."""

    __tablename__ = "consent_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    sub: Mapped[str] = mapped_column(String(255), index=True)
    purpose: Mapped[str] = mapped_column(String(255))
    scope: Mapped[str] = mapped_column(String(255))
    consent_level: Mapped[str] = mapped_column(String(64), default="standard")
    granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revocation_reason: Mapped[str | None] = mapped_column(String(512), nullable=True)


class ConsentTokenRecord(Base):
    """Every CTP token ever issued, for audit and revocation lookups."""

    __tablename__ = "consent_token_records"

    jti: Mapped[str] = mapped_column(String(36), primary_key=True)
    sub: Mapped[str] = mapped_column(String(255), index=True)
    aud: Mapped[str] = mapped_column(String(255))
    iss: Mapped[str] = mapped_column(String(255))
    scope: Mapped[str] = mapped_column(String(255))
    purpose: Mapped[str] = mapped_column(String(255))
    context_hash: Mapped[str] = mapped_column(String(64))
    context_envelope: Mapped[dict] = mapped_column(JSON)
    policy_uri: Mapped[str] = mapped_column(String(512))
    consent_level: Mapped[str] = mapped_column(String(64))
    consent_version: Mapped[str] = mapped_column(String(32))
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revocation_reason: Mapped[str | None] = mapped_column(String(512), nullable=True)


class RevokedToken(Base):
    """Fast revocation lookup / CRL source, keyed by jti."""

    __tablename__ = "revoked_tokens"

    jti: Mapped[str] = mapped_column(String(36), primary_key=True)
    revoked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    reason: Mapped[str] = mapped_column(String(512), default="revoked_by_holder")


class PolicyRule(Base):
    __tablename__ = "policy_rules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(255), unique=True)
    description: Mapped[str] = mapped_column(Text)
    condition: Mapped[dict] = mapped_column(JSON)
    decision: Mapped[str] = mapped_column(String(64))
    priority: Mapped[int] = mapped_column(Integer, default=100)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)


class PDEVDecision(Base):
    __tablename__ = "pdev_decisions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    sub: Mapped[str] = mapped_column(String(255), index=True)
    jti: Mapped[str | None] = mapped_column(String(36), nullable=True)
    purpose: Mapped[str] = mapped_column(String(255))
    requested_feature: Mapped[str] = mapped_column(String(255))
    decision: Mapped[str] = mapped_column(String(64))
    purpose_gate: Mapped[str] = mapped_column(String(16))
    dignity_gate: Mapped[str] = mapped_column(String(16))
    evidence_gate: Mapped[str] = mapped_column(String(16))
    veto_gate: Mapped[str] = mapped_column(String(16))
    reasons: Mapped[list] = mapped_column(JSON)
    ledger_event_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class EGLSignalEvent(Base):
    __tablename__ = "egl_signal_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    sub: Mapped[str] = mapped_column(String(255), index=True)
    event_type: Mapped[str] = mapped_column(String(32), default="classify")
    tier: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tier_label: Mapped[str | None] = mapped_column(String(64), nullable=True)
    signal_codes: Mapped[list] = mapped_column(JSON, default=list)
    features: Mapped[dict] = mapped_column(JSON, default=dict)
    cognitive_load: Mapped[str | None] = mapped_column(String(16), nullable=True)
    emotional_state: Mapped[str | None] = mapped_column(String(32), nullable=True)
    action_risk: Mapped[str | None] = mapped_column(String(16), nullable=True)
    breaker_action: Mapped[str | None] = mapped_column(String(64), nullable=True)
    ledger_event_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class TARAuthorization(Base):
    __tablename__ = "tar_authorizations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    sub: Mapped[str] = mapped_column(String(255), index=True)
    inference_ref: Mapped[str] = mapped_column(String(255))
    inference_recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    authorized_action: Mapped[str] = mapped_column(String(255))
    action_risk: Mapped[str] = mapped_column(String(16))
    escalation_allowed: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(32), default="active")
    authorized_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    reauthorized_from: Mapped[str | None] = mapped_column(String(36), nullable=True)
    ledger_event_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class TrajectoryEvaluation(Base):
    __tablename__ = "trajectory_evaluations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    domain: Mapped[str] = mapped_column(String(255))
    time_window: Mapped[str] = mapped_column(String(64))
    support_mode: Mapped[str] = mapped_column(String(64))
    event_count: Mapped[int] = mapped_column(Integer)
    trajectory_status: Mapped[str] = mapped_column(String(64))
    attenuation: Mapped[str] = mapped_column(String(16))
    proportionality: Mapped[str] = mapped_column(String(16))
    contestability: Mapped[str] = mapped_column(String(16))
    symmetry_of_adaptation: Mapped[str] = mapped_column(String(16))
    recommended_action: Mapped[str] = mapped_column(String(64))
    inputs_summary: Mapped[dict] = mapped_column(JSON)
    ledger_event_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class DignityLedgerEvent(Base):
    __tablename__ = "dignity_ledger_events"

    event_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    # Assigned explicitly in app.ledger.service.append_event (not DB-generated)
    # so the append + hash-chain computation stays a single atomic operation.
    sequence: Mapped[int] = mapped_column(Integer, unique=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    ctid_reference: Mapped[str | None] = mapped_column(String(64), nullable=True)
    jti: Mapped[str | None] = mapped_column(String(36), nullable=True)
    sub: Mapped[str | None] = mapped_column(String(255), nullable=True)
    signal_category: Mapped[str | None] = mapped_column(String(64), nullable=True)
    inference_label: Mapped[str | None] = mapped_column(String(255), nullable=True)
    pdev_action: Mapped[str | None] = mapped_column(String(64), nullable=True)
    decision: Mapped[str] = mapped_column(String(64))
    policy_version: Mapped[str] = mapped_column(String(64))
    context_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    previous_block_hash: Mapped[str] = mapped_column(String(64))
    block_hash: Mapped[str] = mapped_column(String(64))
    hmac_signature: Mapped[str | None] = mapped_column(String(64), nullable=True)
    event_metadata: Mapped[dict] = mapped_column(JSON, default=dict)


class ClaimBoundaryScan(Base):
    __tablename__ = "claim_boundary_scans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    source_label: Mapped[str] = mapped_column(String(255), default="unspecified")
    input_text: Mapped[str] = mapped_column(Text)
    flagged_terms: Mapped[list] = mapped_column(JSON)
    suggestions: Mapped[list] = mapped_column(JSON)
    passed: Mapped[bool] = mapped_column(Boolean)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class LaunchGateRecord(Base):
    __tablename__ = "launch_gate_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    gate_name: Mapped[str] = mapped_column(String(255))
    domain: Mapped[str] = mapped_column(String(255), default="general")
    status: Mapped[str] = mapped_column(String(32))
    score: Mapped[float] = mapped_column(Float)
    maturity_level: Mapped[int] = mapped_column(Integer)
    criteria: Mapped[dict] = mapped_column(JSON)
    notes: Mapped[str] = mapped_column(Text, default="")
    evaluated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
