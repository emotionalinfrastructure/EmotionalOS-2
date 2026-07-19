import { z } from "zod";

export const ChannelSchema = z.enum(["voice", "text", "video"]);
export type Channel = z.infer<typeof ChannelSchema>;

export const ContextEnvelopeSchema = z.object({
  ts: z.string(),
  channel: ChannelSchema,
  features: z.array(z.string()).default([]),
  processor: z.string(),
  purpose: z.string(),
  retention: z.string(),
  jurisdiction: z.string(),
  ui_copy_id: z.string(),
  nonce: z.string(),
});
export type ContextEnvelope = z.infer<typeof ContextEnvelopeSchema>;

export const ActionRiskSchema = z.enum(["low", "medium", "high", "irreversible"]);
export type ActionRisk = z.infer<typeof ActionRiskSchema>;

export const ConsentTokenClaimsSchema = z.object({
  iss: z.string(),
  aud: z.string(),
  sub: z.string(),
  iat: z.number(),
  exp: z.number(),
  jti: z.string(),
  scope: z.string(),
  purpose: z.string(),
  context_hash: z.string(),
  policy_uri: z.string(),
  consent_level: z.string(),
  consent_version: z.literal("ctp-0.1"),
});
export type ConsentTokenClaims = z.infer<typeof ConsentTokenClaimsSchema>;

export const PDEVGateResultSchema = z.enum(["pass", "fail"]);
export const PDEVDecisionSchema = z.enum(["allow", "deny", "review_required", "vetoed"]);

export const PDEVResponseSchema = z.object({
  decision: PDEVDecisionSchema,
  purpose: PDEVGateResultSchema,
  dignity: PDEVGateResultSchema,
  evidence: PDEVGateResultSchema,
  veto: PDEVGateResultSchema,
  reasons: z.array(z.string()),
  ledger_event_id: z.string().nullable().optional(),
});
export type PDEVResponse = z.infer<typeof PDEVResponseSchema>;

export const SignalTierSchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);
export type SignalTier = z.infer<typeof SignalTierSchema>;

export const CircuitBreakerActionSchema = z.enum([
  "sustain",
  "simplify_ui",
  "pause_nonessential_streams",
  "require_human_check_in",
  "require_consent_step_up",
  "hard_block",
]);
export type CircuitBreakerAction = z.infer<typeof CircuitBreakerActionSchema>;

export const TARDecisionSchema = z.enum([
  "allow",
  "deny",
  "review_required",
  "expired",
  "reauthorization_required",
]);

export const TAREvaluateResponseSchema = z.object({
  decision: TARDecisionSchema,
  valid_now: z.boolean(),
  expires_at: z.string().nullable(),
  escalation_allowed: z.boolean(),
  reauthorization_required: z.boolean(),
  reasons: z.array(z.string()),
  ledger_event_id: z.string().nullable().optional(),
});
export type TAREvaluateResponse = z.infer<typeof TAREvaluateResponseSchema>;

export const TrajectoryStatusSchema = z.enum([
  "scaffolding",
  "substitution",
  "stable_support",
  "possible_benevolent_capture",
  "insufficient_data",
]);

export const LegitimacyConditionValueSchema = z.enum(["pass", "fail", "unknown"]);

export const LegitimacyConditionsSchema = z.object({
  attenuation: LegitimacyConditionValueSchema,
  proportionality: LegitimacyConditionValueSchema,
  contestability: LegitimacyConditionValueSchema,
  symmetry_of_adaptation: LegitimacyConditionValueSchema,
});

export const TrajectoryEvaluateResponseSchema = z.object({
  trajectory_status: TrajectoryStatusSchema,
  legitimacy_conditions: LegitimacyConditionsSchema,
  recommended_action: z.enum([
    "continue",
    "reduce_adaptivity",
    "require_disclosure",
    "require_human_review",
    "require_reauthorization",
    "block_escalation",
  ]),
  ledger_event_id: z.string().nullable().optional(),
});
export type TrajectoryEvaluateResponse = z.infer<typeof TrajectoryEvaluateResponseSchema>;

export const LedgerEventSchema = z.object({
  event_id: z.string(),
  sequence: z.number(),
  timestamp: z.string(),
  ctid_reference: z.string().nullable().optional(),
  jti: z.string().nullable().optional(),
  sub: z.string().nullable().optional(),
  signal_category: z.string().nullable().optional(),
  inference_label: z.string().nullable().optional(),
  pdev_action: z.string().nullable().optional(),
  decision: z.string(),
  policy_version: z.string(),
  context_hash: z.string().nullable().optional(),
  previous_block_hash: z.string(),
  block_hash: z.string(),
  hmac_signature: z.string().nullable().optional(),
  event_metadata: z.record(z.unknown()).default({}),
});
export type LedgerEvent = z.infer<typeof LedgerEventSchema>;

export const RESTRICTED_CLAIM_PHRASES = [
  "certified",
  "regulator-approved",
  "legally compliant",
  "clinically validated",
  "externally audited",
  "production-ready",
  "benchmark-proven",
  "standards-body adopted",
  "guaranteed compliant",
  "proven compliance",
] as const;

export const SAFE_CLAIM_REPLACEMENTS = [
  "candidate architecture",
  "proposed framework",
  "reference implementation",
  "validation-ready",
  "designed to align with",
  "pilot implementation",
  "developer prototype",
  "governance runtime",
  "not yet externally audited",
] as const;
