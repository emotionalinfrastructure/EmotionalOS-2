/**
 * Run with: npx tsx examples/basic-flow.ts
 *
 * Demonstrates the client-side half of a CTP + PDEV + Ledger flow using
 * only the SDK (no network calls). The authoritative decisions still come
 * from the governance API (apps/api) -- this shows how a client can build
 * the same context envelope / hash / pre-checks the server expects.
 */
import {
  createConsentContext,
  hashConsentContext,
  evaluatePDEV,
  classifySignalTier,
  scanClaimBoundary,
  verifyLedgerHash,
  computeBlockHash,
  GENESIS_HASH,
} from "../src/index.js";

const context = createConsentContext({
  channel: "text",
  processor: "on_device",
  purpose: "wellbeing_support",
  retention: "session_only",
  jurisdiction: "US-CA",
  uiCopyId: "checkin-prompt-v1",
});

console.log("Context envelope:", context);
console.log("context_hash:", hashConsentContext(context));

const tier = classifySignalTier({ exhaustionScore: 0.82 });
console.log("Signal tier:", tier);

const pdev = evaluatePDEV({
  purpose: "wellbeing_support",
  requestedFeature: "stabilization_prompt",
  context,
  signalTier: tier.tier as 0 | 1 | 2 | 3,
  actionRisk: "medium",
  tokenClaims: null, // no token presented -> PDEV should deny on evidence
});
console.log("PDEV pre-check (no token):", pdev);

const scan = scanClaimBoundary("Our reference implementation is a candidate architecture, not a certified product.");
console.log("Claim scan:", scan);

const e1 = {
  event_id: "example-1",
  timestamp: new Date().toISOString(),
  decision: "allow",
  policy_version: "v1",
  previous_block_hash: GENESIS_HASH,
  block_hash: "",
  event_metadata: { example: true },
};
e1.block_hash = computeBlockHash(e1);
console.log("Ledger verify:", verifyLedgerHash([e1]));
