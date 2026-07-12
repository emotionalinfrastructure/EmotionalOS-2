import { randomUUID } from "node:crypto";
import { canonicalizeJson, sha256Hex } from "@emotional-infrastructure/audit-ledger";

export interface AuditEventInput {
  ctid: string;
  eventType: string;
  operator: string;
  payload: Record<string, unknown>;
  previousSignature?: string | null;
}

export interface AuditEvent extends AuditEventInput {
  id: string;
  timestamp: string;
  signature: string;
}

/** Creates a single, independently-signed audit event. Chaining multiple
 * events (passing each event's signature as the next event's
 * previousSignature) reproduces the same tamper-evidence pattern as the
 * Dignity Ledger, for client-side event trails that are later reconciled
 * against POST /ledger/events. */
export function createAuditEvent(input: AuditEventInput, now: Date = new Date()): AuditEvent {
  const event: Omit<AuditEvent, "signature"> = {
    id: `evt-${randomUUID()}`,
    ctid: input.ctid,
    eventType: input.eventType,
    operator: input.operator,
    payload: input.payload,
    previousSignature: input.previousSignature ?? null,
    timestamp: now.toISOString(),
  };

  const signature = sha256Hex(canonicalizeJson(event));
  return { ...event, signature };
}
