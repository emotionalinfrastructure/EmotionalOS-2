import type { ActionRisk, TAREvaluateResponse } from "@emotional-infrastructure/shared-schemas";

const RISK_RANK: Record<ActionRisk, number> = { low: 0, medium: 1, high: 2, irreversible: 3 };

export interface TARAuthorizationLike {
  status: "active" | "expired" | string;
  actionRisk: ActionRisk;
  escalationAllowed: boolean;
  expiresAt: Date | string;
}

export interface EvaluateTARInput {
  authorization: TARAuthorizationLike | null;
  requestedActionRisk: ActionRisk;
  requestedEscalation?: boolean;
  now?: Date;
}

/** Client-side mirror of apps/api/app/tar/service.py::evaluate. Enforces
 * the TAR principle that an inference reference is never itself
 * authorization: without a live, unexpired TARAuthorization, the answer is
 * always deny/expired/reauthorization_required, never allow. */
export function evaluateTAR(input: EvaluateTARInput): TAREvaluateResponse {
  const reasons: string[] = [];
  const { authorization } = input;

  if (!authorization) {
    return {
      decision: "deny",
      valid_now: false,
      expires_at: null,
      escalation_allowed: false,
      reauthorization_required: true,
      reasons: ["authorization_not_found"],
    };
  }

  const now = input.now ?? new Date();
  const expiresAt = new Date(authorization.expiresAt);
  const isExpired = now.getTime() > expiresAt.getTime() || authorization.status !== "active";
  const validNow = !isExpired;

  let decision: TAREvaluateResponse["decision"];
  let reauthorizationRequired: boolean;

  if (isExpired) {
    decision = "expired";
    reauthorizationRequired = true;
    reasons.push("authorization_window_has_elapsed_or_authorization_inactive");
  } else {
    const requestedRank = RISK_RANK[input.requestedActionRisk];
    const authorizedRank = RISK_RANK[authorization.actionRisk];
    if (requestedRank > authorizedRank) {
      if (input.requestedEscalation && authorization.escalationAllowed) {
        decision = "review_required";
        reauthorizationRequired = false;
        reasons.push("escalation_requested_within_allowed_scope_requires_human_review");
      } else {
        decision = "reauthorization_required";
        reauthorizationRequired = true;
        reasons.push("requested_action_risk_exceeds_authorized_scope");
      }
    } else {
      decision = "allow";
      reauthorizationRequired = false;
      reasons.push("requested_action_is_within_authorized_scope_and_window");
    }
  }

  return {
    decision,
    valid_now: validNow,
    expires_at: expiresAt.toISOString(),
    escalation_allowed: authorization.escalationAllowed,
    reauthorization_required: reauthorizationRequired,
    reasons,
  };
}
