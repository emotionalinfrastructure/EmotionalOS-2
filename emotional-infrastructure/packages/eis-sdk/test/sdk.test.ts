import { describe, expect, it } from "vitest";
import {
  calculateTrustDelta,
  canonicalizeJson,
  classifySignalTier,
  computeBlockHash,
  createAuditEvent,
  createCTID,
  createConsentContext,
  evaluatePDEV,
  evaluateTAR,
  evaluateToleranceWindow,
  evaluateTrajectory,
  hashConsentContext,
  scanClaimBoundary,
  sha256Hex,
  validateConsentState,
  verifyLedgerHash,
  GENESIS_HASH,
} from "../src/index.js";

describe("createCTID", () => {
  it("creates a valid UUID by default", () => {
    const id = createCTID({ sub: "user-1", purpose: "wellbeing_support", scope: "signal.process" });
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it("is deterministic when requested", () => {
    const a = createCTID({ sub: "u", purpose: "p", scope: "s", deterministic: true });
    const b = createCTID({ sub: "u", purpose: "p", scope: "s", deterministic: true });
    expect(a).toBe(b);
  });

  it("rejects missing fields", () => {
    expect(() => createCTID({ sub: "", purpose: "p", scope: "s" })).toThrow();
  });
});

describe("canonical hash stability", () => {
  it("produces the same hash regardless of key order", () => {
    const a = sha256Hex(canonicalizeJson({ b: 1, a: 2 }));
    const b = sha256Hex(canonicalizeJson({ a: 2, b: 1 }));
    expect(a).toBe(b);
  });

  it("hashConsentContext matches manual canonicalize+sha256", () => {
    const context = createConsentContext({
      channel: "text",
      processor: "on_device",
      purpose: "wellbeing_support",
      retention: "session_only",
      jurisdiction: "US-CA",
      uiCopyId: "ui-1",
    });
    expect(hashConsentContext(context)).toBe(sha256Hex(canonicalizeJson(context)));
  });
});

describe("classifySignalTier", () => {
  it("classifies tier 3 manipulation vectors", () => {
    const result = classifySignalTier({ attachmentBuildingScore: 0.9 });
    expect(result.tier).toBe(3);
  });

  it("classifies tier 0 basal state with no signals", () => {
    const result = classifySignalTier({});
    expect(result.tier).toBe(0);
  });

  it("classifies tier 2 vulnerability markers", () => {
    const result = classifySignalTier({ exhaustionScore: 0.8 });
    expect(result.tier).toBe(2);
  });
});

describe("scanClaimBoundary", () => {
  it("flags restricted overclaiming terms", () => {
    const result = scanClaimBoundary("This is a certified, production-ready system.");
    expect(result.passed).toBe(false);
    expect(result.flaggedTerms.map((f) => f.term)).toContain("certified");
  });

  it("passes claim-disciplined language", () => {
    const result = scanClaimBoundary("This is a candidate architecture and reference implementation.");
    expect(result.passed).toBe(true);
  });
});

describe("verifyLedgerHash", () => {
  it("verifies a valid chain and rejects a tampered one", () => {
    const e1 = {
      event_id: "e1",
      timestamp: "2026-07-03T12:00:00Z",
      decision: "allow",
      policy_version: "v1",
      previous_block_hash: GENESIS_HASH,
      block_hash: "",
      event_metadata: {},
    };
    e1.block_hash = computeBlockHash(e1);
    expect(verifyLedgerHash([e1]).valid).toBe(true);
    expect(verifyLedgerHash([{ ...e1, decision: "deny" }]).valid).toBe(false);
  });
});

describe("evaluatePDEV", () => {
  it("denies when no token is presented", () => {
    const result = evaluatePDEV({ purpose: "wellbeing_support", requestedFeature: "stabilization_prompt" });
    expect(result.decision).toBe("deny");
    expect(result.evidence).toBe("fail");
  });

  it("allows a well-formed request with matching token claims", () => {
    const context = createConsentContext({
      channel: "text",
      processor: "on_device",
      purpose: "wellbeing_support",
      retention: "session_only",
      jurisdiction: "US-CA",
      uiCopyId: "ui-1",
    });
    const result = evaluatePDEV({
      purpose: "wellbeing_support",
      requestedFeature: "stabilization_prompt",
      context,
      tokenClaims: {
        iss: "https://x",
        aud: "x",
        sub: "user-1",
        iat: 1,
        exp: 2,
        jti: "j",
        scope: "s",
        purpose: "wellbeing_support",
        context_hash: hashConsentContext(context),
        policy_uri: "https://x/policy",
        consent_level: "standard",
        consent_version: "ctp-0.1",
      },
      tokenRevoked: false,
      signalTier: 0,
      actionRisk: "low",
    });
    expect(result.decision).toBe("allow");
  });
});

describe("evaluateTAR", () => {
  it("returns expired for a past authorization", () => {
    const result = evaluateTAR({
      authorization: {
        status: "active",
        actionRisk: "medium",
        escalationAllowed: false,
        expiresAt: new Date(Date.now() - 1000),
      },
      requestedActionRisk: "medium",
    });
    expect(result.decision).toBe("expired");
    expect(result.reauthorization_required).toBe(true);
  });

  it("requires reauthorization when requested risk exceeds authorized risk", () => {
    const result = evaluateTAR({
      authorization: {
        status: "active",
        actionRisk: "low",
        escalationAllowed: false,
        expiresAt: new Date(Date.now() + 60_000),
      },
      requestedActionRisk: "irreversible",
    });
    expect(result.decision).toBe("reauthorization_required");
  });
});

describe("evaluateTrajectory", () => {
  it("reports insufficient_data below the event threshold", () => {
    const result = evaluateTrajectory({ systemEvents: [{ type: "check_in", actor: "system", ts: "t" }] });
    expect(result.trajectory_status).toBe("insufficient_data");
  });

  it("reports substitution when task_substitution dominates", () => {
    const events = Array.from({ length: 6 }, (_, i) => ({
      type: "task_substitution",
      actor: "system" as const,
      ts: `t${i}`,
    }));
    const result = evaluateTrajectory({ systemEvents: events, centralityTrend: "increasing" });
    expect(result.trajectory_status).toBe("substitution");
    expect(result.recommended_action).toBe("block_escalation");
  });
});

describe("evaluateToleranceWindow", () => {
  it("reports open while under limit and before expiry", () => {
    const result = evaluateToleranceWindow({
      ctid: "c1",
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      interactionLimit: 5,
      interactionCount: 1,
      behaviorThreshold: 0.5,
    });
    expect(result.status).toBe("open");
  });

  it("reports expired after expiresAt", () => {
    const result = evaluateToleranceWindow({
      ctid: "c1",
      startsAt: new Date(),
      expiresAt: new Date(Date.now() - 1000),
      interactionLimit: 5,
      interactionCount: 1,
      behaviorThreshold: 0.5,
    });
    expect(result.status).toBe("expired");
  });
});

describe("calculateTrustDelta", () => {
  it("marks manipulation-related causes as critical", () => {
    const result = calculateTrustDelta({ before: "positive", after: "negative", cause: "manipulative nudging" });
    expect(result.severity).toBe("critical");
  });
});

describe("createAuditEvent", () => {
  it("gives each event a unique id but a signature reproducible from its own fields", () => {
    const now = new Date("2026-07-03T12:00:00Z");
    const a = createAuditEvent({ ctid: "c1", eventType: "issue", operator: "system", payload: { x: 1 } }, now);
    const b = createAuditEvent({ ctid: "c1", eventType: "issue", operator: "system", payload: { x: 1 } }, now);
    expect(a.id).not.toBe(b.id);
    expect(a.signature).not.toBe(b.signature);

    // signature must be reproducible purely from the event's own stored fields
    const { signature, ...withoutSignature } = a;
    expect(sha256Hex(canonicalizeJson(withoutSignature))).toBe(signature);
  });
});

describe("validateConsentState", () => {
  it("rejects revoked state", () => {
    expect(validateConsentState({ status: "revoked" }).valid).toBe(false);
  });

  it("accepts active state with future expiry", () => {
    const result = validateConsentState({ status: "active", expiresAt: new Date(Date.now() + 60_000) });
    expect(result.valid).toBe(true);
  });
});
