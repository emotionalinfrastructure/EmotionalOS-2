import { canonicalizeJson, sha256Hex } from "@emotional-infrastructure/audit-ledger";
import type { ActionRisk, ConsentTokenClaims, ContextEnvelope, PDEVResponse } from "@emotional-infrastructure/shared-schemas";

export const DEFAULT_APPROVED_PURPOSES = new Set([
  "wellbeing_support",
  "interface_tempo_adaptation",
  "safety_intervention",
  "accessibility_support",
  "research_analytics_aggregate",
  "customer_support",
]);

export const DEFAULT_PURPOSE_FEATURE_ALLOWLIST: Record<string, Set<string>> = {
  wellbeing_support: new Set(["stabilization_prompt", "check_in_prompt", "resource_referral"]),
  interface_tempo_adaptation: new Set(["tempo_adjustment", "ui_simplification"]),
  safety_intervention: new Set(["human_escalation", "cooldown_delay", "stabilization_prompt"]),
  accessibility_support: new Set(["ui_simplification", "tempo_adjustment"]),
  research_analytics_aggregate: new Set(["aggregate_reporting"]),
  customer_support: new Set(["human_escalation", "resource_referral"]),
};

const IRREVERSIBLE_OR_HIGH_RISK = new Set<ActionRisk>(["high", "irreversible"]);

export interface EvaluatePDEVInput {
  purpose: string;
  requestedFeature: string;
  tokenClaims?: ConsentTokenClaims | null;
  tokenRevoked?: boolean;
  context?: ContextEnvelope | null;
  signalTier?: 0 | 1 | 2 | 3;
  actionRisk?: ActionRisk;
  stepUpConfirmed?: boolean;
  hiddenSteering?: boolean;
  vetoRequested?: boolean;
  approvedPurposes?: Set<string>;
  purposeFeatureAllowlist?: Record<string, Set<string>>;
}

/** Client-side, offline mirror of apps/api/app/pdev/service.py::evaluate.
 * Useful for pre-flighting a request's likely PDEV outcome before calling
 * the server -- the server's POST /pdev/evaluate remains authoritative
 * because only it can check live token revocation state. */
export function evaluatePDEV(input: EvaluatePDEVInput): PDEVResponse {
  const reasons: string[] = [];
  const approvedPurposes = input.approvedPurposes ?? DEFAULT_APPROVED_PURPOSES;
  const allowlist = input.purposeFeatureAllowlist ?? DEFAULT_PURPOSE_FEATURE_ALLOWLIST;
  const signalTier = input.signalTier ?? 0;
  const actionRisk = input.actionRisk ?? "low";

  let purposeOk = true;
  if (!input.purpose) {
    purposeOk = false;
    reasons.push("purpose_missing");
  } else if (!approvedPurposes.has(input.purpose)) {
    purposeOk = false;
    reasons.push("purpose_not_approved");
  }
  if (input.tokenClaims && input.tokenClaims.purpose !== input.purpose) {
    purposeOk = false;
    reasons.push("purpose_mismatch_with_consent_token");
  }
  const allowedFeatures = allowlist[input.purpose] ?? new Set<string>();
  if (!allowedFeatures.has(input.requestedFeature)) {
    purposeOk = false;
    reasons.push("requested_feature_not_narrow_for_purpose");
  }

  let dignityOk = true;
  if (signalTier === 3) {
    dignityOk = false;
    reasons.push("manipulation_vector_active_tier3");
  }
  if (input.hiddenSteering) {
    dignityOk = false;
    reasons.push("hidden_adaptive_steering_detected");
  }
  const vulnerableState = signalTier === 2;
  const stepUpRequired = vulnerableState && IRREVERSIBLE_OR_HIGH_RISK.has(actionRisk);
  if (stepUpRequired && !input.stepUpConfirmed) {
    dignityOk = false;
    reasons.push("irreversible_action_during_vulnerable_state_without_step_up");
  }

  let evidenceOk = true;
  if (!input.tokenClaims) {
    evidenceOk = false;
    reasons.push("no_consent_token_presented");
  } else {
    if (input.context) {
      const contextHash = sha256Hex(canonicalizeJson(input.context));
      if (contextHash !== input.tokenClaims.context_hash) {
        evidenceOk = false;
        reasons.push("context_hash_mismatch");
      }
    }
    if (input.tokenRevoked) {
      evidenceOk = false;
      reasons.push("consent_token_revoked");
    }
  }

  let vetoOk = true;
  if (input.vetoRequested) {
    vetoOk = false;
    reasons.push("veto_requested");
  }
  if (input.tokenRevoked) {
    vetoOk = false;
    reasons.push("consent_revoked_veto_active");
  }

  let decision: PDEVResponse["decision"];
  if (!vetoOk) {
    decision = "vetoed";
  } else if (!evidenceOk || !purposeOk) {
    decision = "deny";
  } else if (!dignityOk) {
    decision = signalTier === 3 || input.hiddenSteering ? "deny" : "review_required";
  } else {
    decision = "allow";
  }

  return {
    decision,
    purpose: purposeOk ? "pass" : "fail",
    dignity: dignityOk ? "pass" : "fail",
    evidence: evidenceOk ? "pass" : "fail",
    veto: vetoOk ? "pass" : "fail",
    reasons,
  };
}
