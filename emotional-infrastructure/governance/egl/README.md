# EGL -- Emotional Governance Layer

Implementation: `apps/api/app/egl/`. Endpoints: `POST /egl/classify-signal`,
`POST /egl/evaluate-circuit-breaker`, `POST /egl/consent-step-up`.
Client-side mirror: `packages/eis-sdk` `classifySignalTier`.

## Signal tiers

| Tier | Label | Trigger | Governance effect |
|---|---|---|---|
| 0 | Basal state | no elevated feature magnitudes | standard logging only |
| 1 | Operational stress | urgency/repetition/pacing >= 0.4 | interface tempo adaptation only -- never steering, nudging, or upsell |
| 2 | Vulnerability markers | exhaustion/confusion/epistemic-surrender >= 0.5 | stabilization protocols; blocks high-risk/irreversible actions unless step-up succeeds |
| 3 | Manipulation vectors | profiling/attachment-building/insecurity-exploitation >= 0.5 | hard deny + immediate audit flag |

Inputs are pre-computed 0-1 magnitudes from client-side instrumentation --
never raw message text (`apps/api/app/egl/schemas.py::SignalFeatures`).

## Dynamic circuit breaker

Inputs: `cognitive_load` (low/medium/high), `emotional_state`
(stable_flow/distress_vulnerable/unknown), `action_risk`
(low/medium/high/irreversible). Deterministic rule table in
`egl/service.py::evaluate_circuit_breaker` maps these to one of `sustain /
simplify_ui / pause_nonessential_streams / require_human_check_in /
require_consent_step_up / hard_block`.

## Consent step-up

Required when Tier 2 is active and the action is high-risk or
irreversible. Confirmation type is `typed_confirmation` or
`cooldown_delay`; result is `not_required` / `pending` / `approved`, and
is logged to the Dignity Ledger either way.

## Tests

`apps/api/app/tests/test_egl.py` -- Tier 3 hard block, Tier 2 step-up
required/approved, Tier 0 basal state, breaker sustain-when-stable.
