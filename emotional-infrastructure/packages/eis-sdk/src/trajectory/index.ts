import type { TrajectoryEvaluateResponse } from "@emotional-infrastructure/shared-schemas";

export interface SystemEvent {
  type: string;
  actor: "user" | "system";
  ts: string;
}

export interface EvaluateTrajectoryInput {
  systemEvents: SystemEvent[];
  centralityTrend?: "increasing" | "decreasing" | "stable" | "unknown";
}

const MIN_EVENTS_FOR_EVALUATION = 5;
const SUBSTITUTION_STATUS_THRESHOLD = 0.5;
const STABLE_SUPPORT_THRESHOLD = 0.2;
const SYMMETRY_PASS_THRESHOLD = 0.3;
const CONTEST_EVENT_TYPES = new Set(["override", "contest", "veto"]);
const SUBSTITUTION_EVENT_TYPE = "task_substitution";

/** Client-side mirror of apps/api/app/trajectory/service.py::evaluate.
 * Operates strictly on system-level event patterns (who initiated what) --
 * never on raw conversation content or inferred psychological state. */
export function evaluateTrajectory(input: EvaluateTrajectoryInput): TrajectoryEvaluateResponse {
  const total = input.systemEvents.length;

  if (total < MIN_EVENTS_FOR_EVALUATION) {
    return {
      trajectory_status: "insufficient_data",
      legitimacy_conditions: {
        attenuation: "unknown",
        proportionality: "unknown",
        contestability: "unknown",
        symmetry_of_adaptation: "unknown",
      },
      recommended_action: "continue",
    };
  }

  const systemInitiated = input.systemEvents.filter((e) => e.actor === "system").length;
  const userInitiated = total - systemInitiated;
  const symmetryRatio = userInitiated / total;

  const contestEvents = input.systemEvents.filter((e) => CONTEST_EVENT_TYPES.has(e.type)).length;
  const contestability = contestEvents > 0 ? "pass" : "fail";

  const substitutionEvents = input.systemEvents.filter((e) => e.type === SUBSTITUTION_EVENT_TYPE).length;
  const substitutionRatio = substitutionEvents / total;
  const proportionality = substitutionRatio <= STABLE_SUPPORT_THRESHOLD * 2.5 ? "pass" : "fail";

  const centralityTrend = input.centralityTrend ?? "unknown";
  let attenuation: "pass" | "fail" | "unknown";
  if (centralityTrend === "increasing") attenuation = "fail";
  else if (centralityTrend === "decreasing" || centralityTrend === "stable") attenuation = "pass";
  else attenuation = "unknown";

  const symmetryOfAdaptation = symmetryRatio >= SYMMETRY_PASS_THRESHOLD ? "pass" : "fail";

  let trajectoryStatus: TrajectoryEvaluateResponse["trajectory_status"];
  if (substitutionRatio > SUBSTITUTION_STATUS_THRESHOLD) {
    trajectoryStatus = "substitution";
  } else if (attenuation === "fail" && symmetryOfAdaptation === "fail") {
    trajectoryStatus = "possible_benevolent_capture";
  } else if (substitutionRatio <= STABLE_SUPPORT_THRESHOLD && attenuation === "pass") {
    trajectoryStatus = "stable_support";
  } else {
    trajectoryStatus = "scaffolding";
  }

  let recommendedAction: TrajectoryEvaluateResponse["recommended_action"];
  if (trajectoryStatus === "substitution") {
    recommendedAction = "block_escalation";
  } else if (trajectoryStatus === "possible_benevolent_capture") {
    recommendedAction = "require_disclosure";
  } else if (contestability === "fail" || symmetryOfAdaptation === "fail") {
    recommendedAction = "require_human_review";
  } else if (proportionality === "fail") {
    recommendedAction = "reduce_adaptivity";
  } else if (attenuation === "fail") {
    recommendedAction = "require_reauthorization";
  } else {
    recommendedAction = "continue";
  }

  return {
    trajectory_status: trajectoryStatus,
    legitimacy_conditions: {
      attenuation,
      proportionality,
      contestability,
      symmetry_of_adaptation: symmetryOfAdaptation,
    },
    recommended_action: recommendedAction,
  };
}
