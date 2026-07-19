export interface ContextEnvelope {
  ts: string;
  channel: "voice" | "text" | "video";
  features: string[];
  processor: string;
  purpose: string;
  retention: string;
  jurisdiction: string;
  ui_copy_id: string;
  nonce: string;
}

export interface IssueResponse {
  token: string;
  jti: string;
  sub: string;
  scope: string;
  purpose: string;
  context_hash: string;
  policy_uri: string;
  consent_level: string;
  consent_version: string;
  issued_at: string;
  expires_at: string;
  ledger_event_id: string;
}

export interface ValidateResponse {
  decision: string;
  reason: string;
  claims?: Record<string, unknown> | null;
  ledger_event_id?: string | null;
}

export interface RevokeResponse {
  jti: string;
  revoked: boolean;
  ledger_event_id?: string | null;
}

export interface ProcessResponse {
  decision: string;
  reason: string;
  process_id?: string | null;
  processed_at?: string | null;
  result?: Record<string, unknown> | null;
  ledger_event_id?: string | null;
}

export interface PDEVResponse {
  decision: string;
  purpose: string;
  dignity: string;
  evidence: string;
  veto: string;
  reasons: string[];
  ledger_event_id?: string | null;
}

export interface ClassifySignalResponse {
  tier: number;
  tier_label: string;
  signal_codes: string[];
  decision: string;
  ledger_event_id?: string | null;
}

export interface CircuitBreakerResponse {
  breaker_action: string;
  reasons: string[];
  ledger_event_id?: string | null;
}

export interface ConsentStepUpResponse {
  status: string;
  required: boolean;
  ledger_event_id?: string | null;
}

export interface AuthorizationOut {
  id: string;
  sub: string;
  inference_ref: string;
  authorized_action: string;
  action_risk: string;
  escalation_allowed: boolean;
  status: string;
  authorized_at: string;
  expires_at: string;
  ledger_event_id?: string | null;
}

export interface TAREvaluateResponse {
  decision: string;
  valid_now: boolean;
  expires_at: string | null;
  escalation_allowed: boolean;
  reauthorization_required: boolean;
  reasons: string[];
  ledger_event_id?: string | null;
}

export interface TrajectoryResponse {
  trajectory_status: string;
  legitimacy_conditions: {
    attenuation: string;
    proportionality: string;
    contestability: string;
    symmetry_of_adaptation: string;
  };
  recommended_action: string;
  ledger_event_id?: string | null;
}

export interface LedgerEvent {
  event_id: string;
  sequence: number;
  timestamp: string;
  ctid_reference?: string | null;
  jti?: string | null;
  sub?: string | null;
  signal_category?: string | null;
  inference_label?: string | null;
  pdev_action?: string | null;
  decision: string;
  policy_version: string;
  context_hash?: string | null;
  previous_block_hash: string;
  block_hash: string;
  hmac_signature?: string | null;
  event_metadata: Record<string, unknown>;
}

export interface LedgerVerifyResult {
  valid: boolean;
  events_checked: number;
  first_invalid_event_id: string | null;
  reason: string | null;
}

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  condition: Record<string, unknown>;
  decision: string;
  priority: number;
  active: boolean;
  version: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface PolicyEvaluateResponse {
  decision: string;
  matched_rule: string | null;
  reasons: string[];
  ledger_event_id?: string | null;
}

export interface FlaggedTerm {
  term: string;
  start: number;
  end: number;
  matched_text: string;
  suggested_replacement: string;
}

export interface ClaimScanResponse {
  passed: boolean;
  flagged_terms: FlaggedTerm[];
  suggestions: string[];
  scan_id: string;
}

export interface MaturityLevelInfo {
  level: number;
  name: string;
  description: string;
  aspirational_only: boolean;
}

export interface LevelsResponse {
  levels: MaturityLevelInfo[];
  claim_boundary_note: string;
}

export interface AssessResponse {
  maturity_level: number;
  level_name: string;
  score: number;
  satisfied_criteria: string[];
  missing_criteria: string[];
  certification_body_exists: boolean;
  claim_boundary_note: string;
  launch_gate_id: string;
}

export function makeDefaultContext(nonce?: string): ContextEnvelope {
  return {
    ts: new Date().toISOString(),
    channel: "text",
    features: ["tempo"],
    processor: "on_device",
    purpose: "wellbeing_support",
    retention: "session_only",
    jurisdiction: "US-CA",
    ui_copy_id: "ui-001",
    nonce: nonce ?? Math.random().toString(36).slice(2),
  };
}
