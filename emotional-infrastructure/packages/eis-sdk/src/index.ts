// Canonicalization, hashing, and ledger verification primitives.
export { canonicalizeJson, sha256Hex, hmacSha256Hex, verifyLedgerHash, computeBlockHash, GENESIS_HASH } from "@emotional-infrastructure/audit-ledger";
export type { LedgerEventForHashing, LedgerVerifyResult } from "@emotional-infrastructure/audit-ledger";

// CTP: consent tokens, context envelopes, offline state validation.
export { createCTID, createConsentContext, hashConsentContext, validateConsentState } from "./ctp/ctid.js";
export type { CreateCTIDInput, CreateConsentContextInput, ConsentState, ConsentStateInput, ConsentStateResult } from "./ctp/ctid.js";

// Tolerance windows and trust repair.
export { evaluateToleranceWindow } from "./consent/toleranceWindow.js";
export type { ToleranceWindow, ToleranceWindowStatus, ToleranceWindowEvaluation } from "./consent/toleranceWindow.js";
export { calculateTrustDelta } from "./consent/trust.js";
export type { TrustState, TrustDelta, TrustDeltaInput } from "./consent/trust.js";

// Audit events.
export { createAuditEvent } from "./ledger/auditEvent.js";
export type { AuditEvent, AuditEventInput } from "./ledger/auditEvent.js";

// PDEV / TAR / Trajectory offline evaluators.
export { evaluatePDEV, DEFAULT_APPROVED_PURPOSES, DEFAULT_PURPOSE_FEATURE_ALLOWLIST } from "./pdev/index.js";
export type { EvaluatePDEVInput } from "./pdev/index.js";
export { evaluateTAR } from "./tar/index.js";
export type { EvaluateTARInput, TARAuthorizationLike } from "./tar/index.js";
export { evaluateTrajectory } from "./trajectory/index.js";
export type { EvaluateTrajectoryInput, SystemEvent } from "./trajectory/index.js";

// EGL signal-tier classification.
export { classifySignalTier } from "./signals/index.js";
export type { SignalFeatures, SignalTierResult } from "./signals/index.js";

// Claim boundary scanning.
export { scanClaimBoundary, RESTRICTED_PHRASE_REPLACEMENTS } from "./claim-boundary/index.js";
export type { ClaimScanResult, FlaggedTerm } from "./claim-boundary/index.js";

// Re-export shared payload schemas/types for convenience.
export * from "@emotional-infrastructure/shared-schemas";
