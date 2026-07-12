import { describe, expect, it } from "vitest";
import {
  GENESIS_HASH,
  canonicalizeJson,
  computeBlockHash,
  sha256Hex,
  verifyLedgerHash,
  type LedgerEventForHashing,
} from "../src/index.js";

describe("canonicalizeJson", () => {
  it("sorts object keys deterministically", () => {
    expect(canonicalizeJson({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });

  it("produces stable output regardless of input key order", () => {
    const a = canonicalizeJson({ x: 1, y: { b: 2, a: 1 } });
    const b = canonicalizeJson({ y: { a: 1, b: 2 }, x: 1 });
    expect(a).toBe(b);
  });
});

describe("sha256Hex", () => {
  it("is deterministic", () => {
    expect(sha256Hex("hello")).toBe(sha256Hex("hello"));
    expect(sha256Hex("hello")).not.toBe(sha256Hex("hello2"));
  });
});

function makeEvent(overrides: Partial<LedgerEventForHashing> = {}): LedgerEventForHashing {
  const base: LedgerEventForHashing = {
    event_id: "e1",
    timestamp: "2026-07-03T12:00:00Z",
    decision: "allow",
    policy_version: "v1",
    previous_block_hash: GENESIS_HASH,
    block_hash: "",
    event_metadata: {},
  };
  const merged = { ...base, ...overrides };
  merged.block_hash = computeBlockHash(merged);
  return merged;
}

describe("verifyLedgerHash", () => {
  it("validates a correctly chained sequence", () => {
    const e1 = makeEvent({ event_id: "e1" });
    const e2 = makeEvent({ event_id: "e2", previous_block_hash: e1.block_hash });
    const result = verifyLedgerHash([e1, e2]);
    expect(result.valid).toBe(true);
    expect(result.eventsChecked).toBe(2);
  });

  it("detects tampering with a stored field", () => {
    const e1 = makeEvent({ event_id: "e1" });
    const tampered = { ...e1, decision: "deny" };
    const result = verifyLedgerHash([tampered]);
    expect(result.valid).toBe(false);
    expect(result.firstInvalidEventId).toBe("e1");
  });

  it("detects a broken chain link", () => {
    const e1 = makeEvent({ event_id: "e1" });
    const e2 = makeEvent({ event_id: "e2", previous_block_hash: "f".repeat(64) });
    const result = verifyLedgerHash([e1, e2]);
    expect(result.valid).toBe(false);
    expect(result.firstInvalidEventId).toBe("e2");
  });
});
