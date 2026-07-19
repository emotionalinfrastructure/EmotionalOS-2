export type ToleranceWindowStatus = "open" | "closed" | "exceeded" | "expired";

export interface ToleranceWindow {
  ctid: string;
  startsAt: Date;
  expiresAt: Date;
  interactionLimit: number;
  interactionCount: number;
  behaviorThreshold: number;
}

export interface ToleranceWindowEvaluation {
  status: ToleranceWindowStatus;
  remainingCapacity: number;
  fillRatio: number;
}

/** Evaluates a tolerance window's current operational status: expired (past
 * expiresAt), exceeded (interaction limit reached), or open. Used to decide
 * whether a client may continue sending interactions under a given consent
 * grant without calling the server on every single interaction. */
export function evaluateToleranceWindow(window: ToleranceWindow, now: Date = new Date()): ToleranceWindowEvaluation {
  let status: ToleranceWindowStatus;
  if (now.getTime() >= window.expiresAt.getTime()) {
    status = "expired";
  } else if (window.interactionCount >= window.interactionLimit) {
    status = "exceeded";
  } else {
    status = "open";
  }

  return {
    status,
    remainingCapacity: Math.max(window.interactionLimit - window.interactionCount, 0),
    fillRatio: Math.min(window.interactionCount / window.interactionLimit, 1),
  };
}
