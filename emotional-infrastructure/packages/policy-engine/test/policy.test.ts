import { describe, expect, it } from "vitest";
import { DEFAULT_RULES, evaluatePolicy } from "../src/index.js";

describe("evaluatePolicy", () => {
  it("denies when token is missing", () => {
    const result = evaluatePolicy({ token_present: false });
    expect(result.decision).toBe("deny");
    expect(result.matchedRule).toBe("deny_missing_or_invalid_consent");
  });

  it("denies tier 3 manipulation vectors", () => {
    const result = evaluatePolicy({ token_present: true, token_valid: true, signal_tier: 3 });
    expect(result.decision).toBe("deny");
    expect(result.matchedRule).toBe("deny_tier3_manipulation");
  });

  it("allows tier 0 ordinary processing", () => {
    const result = evaluatePolicy({ token_present: true, token_valid: true, signal_tier: 0 });
    expect(result.decision).toBe("allow");
    expect(result.matchedRule).toBe("allow_tier0_ordinary_processing");
  });

  it("requires step-up for tier 2 irreversible actions", () => {
    const result = evaluatePolicy({
      token_present: true,
      token_valid: true,
      signal_tier: 2,
      action_risk: "irreversible",
      step_up_confirmed: false,
    });
    expect(result.decision).toBe("review_required");
    expect(result.matchedRule).toBe("require_step_up_tier2_irreversible");
  });

  it("falls back to review_required when nothing matches", () => {
    const result = evaluatePolicy(
      { token_present: true, token_valid: true, signal_tier: 99 },
      DEFAULT_RULES.filter((r) => r.name === "deny_revoked_token"),
    );
    expect(result.decision).toBe("review_required");
    expect(result.matchedRule).toBeNull();
  });
});
