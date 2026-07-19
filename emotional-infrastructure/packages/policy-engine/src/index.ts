/** Policy condition mini-language: one leaf checks one field against an
 * expected value or membership set, combined with all/any. Mirrors
 * apps/api/app/policy/rules.py exactly so client-side pre-checks and
 * server-side POST /policy/evaluate agree. */
export type PolicyCondition =
  | { all: PolicyCondition[] }
  | { any: PolicyCondition[] }
  | { field: string; equals: unknown }
  | { field: string; in: unknown[] };

export interface PolicyRule {
  name: string;
  description: string;
  decision: "allow" | "deny" | "review_required" | "reauthorization_required" | "vetoed";
  priority: number;
  condition: PolicyCondition;
}

export type PolicyContext = Record<string, unknown>;

export function matches(condition: PolicyCondition, context: PolicyContext): boolean {
  if ("all" in condition) return condition.all.every((sub) => matches(sub, context));
  if ("any" in condition) return condition.any.some((sub) => matches(sub, context));

  const value = context[condition.field];
  if ("equals" in condition) return value === condition.equals;
  if ("in" in condition) return condition.in.includes(value);
  return false;
}

export const FALLBACK_DECISION = "review_required" as const;

export const DEFAULT_RULES: PolicyRule[] = [
  {
    name: "deny_missing_or_invalid_consent",
    description: "Deny protected processing without a valid CTP token.",
    decision: "deny",
    priority: 10,
    condition: { any: [{ field: "token_present", equals: false }, { field: "token_valid", equals: false }] },
  },
  {
    name: "deny_revoked_token",
    description: "Deny processing when the presented CTP token has been revoked.",
    decision: "deny",
    priority: 15,
    condition: { field: "token_revoked", equals: true },
  },
  {
    name: "deny_context_mismatch",
    description: "Deny processing when the submitted context envelope hash does not match the token.",
    decision: "deny",
    priority: 20,
    condition: { field: "context_match", equals: false },
  },
  {
    name: "deny_tier3_manipulation",
    description: "Deny and flag any request associated with a Tier 3 manipulation-vector signal.",
    decision: "deny",
    priority: 25,
    condition: { field: "signal_tier", equals: 3 },
  },
  {
    name: "require_step_up_tier2_irreversible",
    description: "Require consent step-up for Tier 2 vulnerability markers plus a high-risk or irreversible action.",
    decision: "review_required",
    priority: 30,
    condition: {
      all: [
        { field: "signal_tier", equals: 2 },
        { field: "action_risk", in: ["high", "irreversible"] },
        { field: "step_up_confirmed", equals: false },
      ],
    },
  },
  {
    name: "require_tar_authorization",
    description: "Require a live TAR authorization before acting on an inferred state.",
    decision: "reauthorization_required",
    priority: 35,
    condition: {
      all: [{ field: "acts_on_inferred_state", equals: true }, { field: "tar_authorized", equals: false }],
    },
  },
  {
    name: "require_trajectory_review_on_substitution_risk",
    description: "Require human review when trajectory substitution risk is elevated.",
    decision: "review_required",
    priority: 40,
    condition: { field: "substitution_risk_elevated", equals: true },
  },
  {
    name: "deny_tier1_steering",
    description: "Tier 1 operational-stress signals may adapt interface tempo only; using them for steering is denied.",
    decision: "deny",
    priority: 45,
    condition: { all: [{ field: "signal_tier", equals: 1 }, { field: "is_steering", equals: true }] },
  },
  {
    name: "allow_tier0_ordinary_processing",
    description: "Tier 0 basal-state signals are allowed for ordinary processing.",
    decision: "allow",
    priority: 90,
    condition: { field: "signal_tier", equals: 0 },
  },
  {
    name: "allow_tier1_tempo_adaptation",
    description: "Tier 1 signals are allowed for interface tempo adaptation only, never for steering.",
    decision: "allow",
    priority: 91,
    condition: { all: [{ field: "signal_tier", equals: 1 }, { field: "is_steering", equals: false }] },
  },
];

export interface PolicyEvaluation {
  decision: PolicyRule["decision"] | typeof FALLBACK_DECISION;
  matchedRule: string | null;
}

/** Evaluates a context against an ordered rule list (lowest priority number
 * wins first) and returns the first match, falling back to review_required. */
export function evaluatePolicy(context: PolicyContext, rules: PolicyRule[] = DEFAULT_RULES): PolicyEvaluation {
  const sorted = [...rules].sort((a, b) => a.priority - b.priority);
  for (const rule of sorted) {
    if (matches(rule.condition, context)) {
      return { decision: rule.decision, matchedRule: rule.name };
    }
  }
  return { decision: FALLBACK_DECISION, matchedRule: null };
}
