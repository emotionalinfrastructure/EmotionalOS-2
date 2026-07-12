import { describe, expect, it } from "vitest";
import {
  ContextEnvelopeSchema,
  ConsentTokenClaimsSchema,
  LedgerEventSchema,
  PDEVResponseSchema,
  RESTRICTED_CLAIM_PHRASES,
} from "../src/index.js";

describe("ContextEnvelopeSchema", () => {
  it("accepts a valid envelope", () => {
    const result = ContextEnvelopeSchema.safeParse({
      ts: "2026-07-03T12:00:00Z",
      channel: "text",
      features: ["tempo"],
      processor: "on_device",
      purpose: "wellbeing_support",
      retention: "session_only",
      jurisdiction: "US-CA",
      ui_copy_id: "ui-001",
      nonce: "abc123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid channel", () => {
    const result = ContextEnvelopeSchema.safeParse({
      ts: "2026-07-03T12:00:00Z",
      channel: "telepathy",
      processor: "on_device",
      purpose: "wellbeing_support",
      retention: "session_only",
      jurisdiction: "US-CA",
      ui_copy_id: "ui-001",
      nonce: "abc123",
    });
    expect(result.success).toBe(false);
  });
});

describe("ConsentTokenClaimsSchema", () => {
  it("requires consent_version to be exactly ctp-0.1", () => {
    const base = {
      iss: "https://x",
      aud: "x",
      sub: "user-1",
      iat: 1,
      exp: 2,
      jti: "j",
      scope: "s",
      purpose: "p",
      context_hash: "h",
      policy_uri: "https://x/policy",
      consent_level: "standard",
    };
    expect(ConsentTokenClaimsSchema.safeParse({ ...base, consent_version: "ctp-0.1" }).success).toBe(true);
    expect(ConsentTokenClaimsSchema.safeParse({ ...base, consent_version: "ctp-0.2" }).success).toBe(false);
  });
});

describe("PDEVResponseSchema", () => {
  it("validates a full PDEV response", () => {
    const result = PDEVResponseSchema.safeParse({
      decision: "allow",
      purpose: "pass",
      dignity: "pass",
      evidence: "pass",
      veto: "pass",
      reasons: [],
      ledger_event_id: "abc",
    });
    expect(result.success).toBe(true);
  });
});

describe("LedgerEventSchema", () => {
  it("validates a ledger event shape", () => {
    const result = LedgerEventSchema.safeParse({
      event_id: "e1",
      sequence: 1,
      timestamp: "2026-07-03T12:00:00Z",
      decision: "allow",
      policy_version: "v1",
      previous_block_hash: "0".repeat(64),
      block_hash: "a".repeat(64),
      event_metadata: {},
    });
    expect(result.success).toBe(true);
  });
});

describe("RESTRICTED_CLAIM_PHRASES", () => {
  it("includes the core overclaiming terms", () => {
    expect(RESTRICTED_CLAIM_PHRASES).toContain("certified");
    expect(RESTRICTED_CLAIM_PHRASES).toContain("production-ready");
  });
});
