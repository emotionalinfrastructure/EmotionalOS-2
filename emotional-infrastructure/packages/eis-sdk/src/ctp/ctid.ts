import { randomUUID } from "node:crypto";
import { canonicalizeJson, sha256Hex } from "@emotional-infrastructure/audit-ledger";
import type { ContextEnvelope } from "@emotional-infrastructure/shared-schemas";

export interface CreateCTIDInput {
  sub: string;
  purpose: string;
  scope: string;
  deterministic?: boolean;
}

/** Creates a CTID (consent token identifier), formatted as a UUID. When
 * `deterministic` is set, the same (sub, purpose, scope) always yields the
 * same id -- useful for idempotent client-side correlation, never used as
 * the CTP `jti` itself (the server always mints its own UUIDv4 jti). */
export function createCTID(input: CreateCTIDInput): string {
  if (!input.sub.trim()) throw new Error("sub is required");
  if (!input.purpose.trim()) throw new Error("purpose is required");
  if (!input.scope.trim()) throw new Error("scope is required");

  if (input.deterministic) {
    const digest = sha256Hex(`${input.sub}|${input.purpose}|${input.scope}`);
    return [
      digest.slice(0, 8),
      digest.slice(8, 12),
      digest.slice(12, 16),
      digest.slice(16, 20),
      digest.slice(20, 32),
    ].join("-");
  }

  return randomUUID();
}

export interface CreateConsentContextInput {
  channel: "voice" | "text" | "video";
  processor: string;
  purpose: string;
  retention: string;
  jurisdiction: string;
  uiCopyId: string;
  features?: string[];
  now?: Date;
}

/** Builds a CTP context envelope with a fresh timestamp and nonce. The
 * result must contain no PII -- callers should only pass structural /
 * operational metadata, matching apps/api/app/schemas.py::ContextEnvelope. */
export function createConsentContext(input: CreateConsentContextInput): ContextEnvelope {
  const now = input.now ?? new Date();
  return {
    ts: now.toISOString(),
    channel: input.channel,
    features: input.features ?? [],
    processor: input.processor,
    purpose: input.purpose,
    retention: input.retention,
    jurisdiction: input.jurisdiction,
    ui_copy_id: input.uiCopyId,
    nonce: randomUUID(),
  };
}

/** Computes the SHA-256 context_hash of a context envelope exactly as the
 * server does: canonical JSON (sorted keys, no whitespace) then SHA-256. */
export function hashConsentContext(context: ContextEnvelope): string {
  return sha256Hex(canonicalizeJson(context));
}

export type ConsentState = "active" | "suspended" | "revoked" | "expired" | "pending_review";

export interface ConsentStateInput {
  status: ConsentState;
  expiresAt?: Date | string | null;
  now?: Date;
}

export interface ConsentStateResult {
  valid: boolean;
  reason: string;
}

/** Validates whether a held consent token is currently usable: not
 * revoked/expired, and (if a lifetime is known) not past its expiry. This
 * is a local, offline pre-check -- the authoritative decision always comes
 * from POST /ctp/validate against the server's revocation state. */
export function validateConsentState(input: ConsentStateInput): ConsentStateResult {
  if (input.status === "revoked") return { valid: false, reason: "revoked" };
  if (input.status === "expired") return { valid: false, reason: "expired" };
  if (input.status === "pending_review") return { valid: false, reason: "pending_review" };

  if (input.expiresAt) {
    const expiresAt = new Date(input.expiresAt);
    const now = input.now ?? new Date();
    if (expiresAt.getTime() <= now.getTime()) {
      return { valid: false, reason: "expired" };
    }
  }

  if (input.status === "suspended") return { valid: false, reason: "suspended" };
  return { valid: true, reason: "ok" };
}
