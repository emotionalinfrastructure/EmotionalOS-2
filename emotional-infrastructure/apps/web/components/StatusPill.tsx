const ALLOW = new Set(["allow", "pass", "valid", "active"]);
const DENY = new Set(["deny", "fail", "vetoed", "expired", "hard_block", "revoked", "invalid"]);
const REVIEW = new Set([
  "review_required",
  "reauthorization_required",
  "require_human_check_in",
  "require_consent_step_up",
  "pending",
  "insufficient_data",
]);

export function StatusPill({ value }: { value: string }) {
  const normalized = value?.toLowerCase() ?? "";
  let className = "pill pill-neutral";
  if (ALLOW.has(normalized)) className = "pill pill-allow";
  else if (DENY.has(normalized)) className = "pill pill-deny";
  else if (REVIEW.has(normalized)) className = "pill pill-review";

  return <span className={className}>{value}</span>;
}
