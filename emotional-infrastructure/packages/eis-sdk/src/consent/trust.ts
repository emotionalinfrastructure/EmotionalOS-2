export type TrustState = "positive" | "neutral" | "negative" | "unknown";

export interface TrustDeltaInput {
  before: TrustState;
  after: TrustState;
  cause: string;
  reversible?: boolean;
}

export interface TrustDelta {
  before: TrustState;
  after: TrustState;
  cause: string;
  reversible: boolean;
  severity: "low" | "medium" | "high" | "critical";
  magnitude: number;
}

const STATE_RANK: Record<TrustState, number> = { negative: -1, unknown: 0, neutral: 0, positive: 1 };

/** Computes the magnitude and severity of a trust change between two
 * recorded trust states, e.g. after a rupture or a repair action. Severity
 * escalates to "critical" for causes indicating harm, coercion, or
 * manipulation regardless of the numeric state delta. */
export function calculateTrustDelta(input: TrustDeltaInput): TrustDelta {
  const reversible = input.reversible ?? true;
  const magnitude = STATE_RANK[input.after] - STATE_RANK[input.before];
  const cause = input.cause.toLowerCase();

  let severity: TrustDelta["severity"];
  if (/harm|unsafe|coerc|manipulat/.test(cause)) {
    severity = "critical";
  } else if (input.before === "positive" && input.after === "negative" && !reversible) {
    severity = "high";
  } else if (input.after === "negative") {
    severity = "medium";
  } else {
    severity = "low";
  }

  return { before: input.before, after: input.after, cause: input.cause, reversible, severity, magnitude };
}
