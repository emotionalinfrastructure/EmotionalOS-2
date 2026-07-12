import { createHash, createHmac } from "node:crypto";

/** Canonical JSON: sorted keys, no insignificant whitespace. Mirrors
 * apps/api/app/security/hashing.py::canonicalize_json exactly so hashes
 * computed client-side and server-side agree. */
export function canonicalizeJson(value: unknown): string {
  return stableStringify(value);
}

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}

export function sha256Hex(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

export function hmacSha256Hex(secret: string, message: string): string {
  return createHmac("sha256", secret).update(message, "utf8").digest("hex");
}

export const GENESIS_HASH = "0".repeat(64);

export interface LedgerEventForHashing {
  event_id: string;
  timestamp: string;
  ctid_reference?: string | null;
  jti?: string | null;
  sub?: string | null;
  signal_category?: string | null;
  inference_label?: string | null;
  pdev_action?: string | null;
  decision: string;
  policy_version: string;
  context_hash?: string | null;
  previous_block_hash: string;
  block_hash: string;
  hmac_signature?: string | null;
  event_metadata: Record<string, unknown>;
}

function payloadForHash(event: LedgerEventForHashing): Record<string, unknown> {
  return {
    event_id: event.event_id,
    timestamp: event.timestamp,
    ctid_reference: event.ctid_reference ?? null,
    jti: event.jti ?? null,
    sub: event.sub ?? null,
    signal_category: event.signal_category ?? null,
    inference_label: event.inference_label ?? null,
    pdev_action: event.pdev_action ?? null,
    decision: event.decision,
    policy_version: event.policy_version,
    context_hash: event.context_hash ?? null,
    previous_block_hash: event.previous_block_hash,
    event_metadata: event.event_metadata ?? {},
  };
}

/** Recomputes a single event's block hash from its stored fields. */
export function computeBlockHash(event: LedgerEventForHashing): string {
  return sha256Hex(canonicalizeJson(payloadForHash(event)) + event.previous_block_hash);
}

export interface LedgerVerifyResult {
  valid: boolean;
  eventsChecked: number;
  firstInvalidEventId: string | null;
  reason: string | null;
}

/** Verifies an ordered array of ledger events forms an unbroken hash chain,
 * mirroring apps/api/app/ledger/service.py::verify_chain. Optionally checks
 * the HMAC signature if a secret is provided and events carry one. */
export function verifyLedgerHash(events: LedgerEventForHashing[], hmacSecret?: string): LedgerVerifyResult {
  let expectedPrevious = GENESIS_HASH;

  for (let i = 0; i < events.length; i += 1) {
    const event = events[i];

    if (event.previous_block_hash !== expectedPrevious) {
      return {
        valid: false,
        eventsChecked: i,
        firstInvalidEventId: event.event_id,
        reason: "previous_block_hash does not match prior event's block_hash",
      };
    }

    const recomputed = computeBlockHash(event);
    if (recomputed !== event.block_hash) {
      return {
        valid: false,
        eventsChecked: i + 1,
        firstInvalidEventId: event.event_id,
        reason: "block_hash does not match recomputed hash of stored fields",
      };
    }

    if (hmacSecret && event.hmac_signature) {
      const recomputedHmac = hmacSha256Hex(hmacSecret, event.block_hash);
      if (recomputedHmac !== event.hmac_signature) {
        return {
          valid: false,
          eventsChecked: i + 1,
          firstInvalidEventId: event.event_id,
          reason: "hmac_signature does not match recomputed hmac",
        };
      }
    }

    expectedPrevious = event.block_hash;
  }

  return { valid: true, eventsChecked: events.length, firstInvalidEventId: null, reason: null };
}
