# API Reference

Base URL: `http://localhost:8000` (local), interactive docs at `/docs`
(Swagger UI, auto-generated from the FastAPI schema -- always the most
current source of truth for request/response shapes).

All endpoints below are real, backed by PostgreSQL, and write a Dignity
Ledger event for every governance decision they make.

## CTP -- Consent Token Protocol (`/ctp`)

| Method | Path | Description |
|---|---|---|
| POST | `/ctp/issue` | Mints an ES256 JWT (<=300s lifetime), computes `context_hash`, persists `ConsentTokenRecord`, logs a ledger event. |
| POST | `/ctp/validate` | Verifies signature/expiry/revocation/context-hash/scope/purpose. Returns 200 allow, 400 context mismatch, 401 missing/expired/invalid/malformed/revoked, 403 scope/purpose mismatch. |
| POST | `/ctp/revoke` | Adds `jti` to the revocation list; 404 if unknown. |
| POST | `/ctp/introspect` | Returns `active`/`expired`/`revoked` plus decoded claims (best-effort for invalid tokens). |
| GET | `/ctp/crl` | Lists all revoked `jti`s with reason and timestamp. |
| POST | `/ctp/process` | Runs the full validate gate; if allowed, executes and returns a real processing acknowledgement (`process_id`, `result`). |

## PDEV -- Purpose, Dignity, Evidence, Veto (`/pdev`)

| Method | Path | Description |
|---|---|---|
| POST | `/pdev/evaluate` | Runs all four gates against a token (optional), context, signal tier, action risk, and step-up/veto flags. Returns `{decision, purpose, dignity, evidence, veto, reasons, ledger_event_id}`. |

## EGL -- Emotional Governance Layer (`/egl`)

| Method | Path | Description |
|---|---|---|
| POST | `/egl/classify-signal` | Maps submitted 0-1 behavioral-signal magnitudes to a governance tier (0-3) via fixed thresholds. |
| POST | `/egl/evaluate-circuit-breaker` | Maps `(cognitive_load, emotional_state, action_risk)` to one of `sustain / simplify_ui / pause_nonessential_streams / require_human_check_in / require_consent_step_up / hard_block`. |
| POST | `/egl/consent-step-up` | Evaluates whether Tier 2 + high/irreversible risk requires typed-confirmation or cooldown-delay step-up, and whether it was satisfied. |

## TAR -- Temporal Affective Regulation (`/tar`)

| Method | Path | Description |
|---|---|---|
| POST | `/tar/authorize` | Creates a time-boxed `TARAuthorization` for an inference reference + authorized action + risk level. |
| POST | `/tar/evaluate` | Checks whether a requested action is within an authorization's window and risk scope; returns `allow / deny / review_required / expired / reauthorization_required`. |
| POST | `/tar/expire` | Manually expires an authorization before its natural TTL. |
| GET | `/tar/authorizations/{id}` | Fetches a single authorization record. |

## Trajectory Governance (`/trajectory`)

| Method | Path | Description |
|---|---|---|
| POST | `/trajectory/evaluate` | Evaluates system-level event patterns (never message content) for attenuation, proportionality, contestability, and symmetry of adaptation; returns a trajectory status and recommended action. |
| GET | `/trajectory/evaluations` | Lists recent evaluations. |
| GET | `/trajectory/evaluations/{id}` | Fetches one evaluation. |

## Dignity Ledger (`/ledger`)

| Method | Path | Description |
|---|---|---|
| POST | `/ledger/events` | Appends a ledger event directly (used internally by every other module; also exposed for manual/testing use). |
| GET | `/ledger/events` | Lists events, optionally filtered by `sub`, `jti`, `decision`. |
| GET | `/ledger/events/{id}` | Fetches one event. |
| GET | `/ledger/verify` | Recomputes every event's hash from stored fields and checks chain continuity; reports the first broken link if any. |
| GET | `/ledger/export.json` | Full ledger as JSON. |
| GET | `/ledger/export.csv` | Full ledger as CSV. |

## Policy Engine (`/policy`)

| Method | Path | Description |
|---|---|---|
| GET | `/policy/rules` | Lists all rules (default + custom), ordered by priority. |
| POST | `/policy/rules` | Creates a custom rule (`condition` mini-language: `{field, equals}` / `{field, in}` / `{all:[...]}` / `{any:[...]}`). |
| PATCH | `/policy/rules/{id}` | Updates a rule; bumps its version. |
| POST | `/policy/evaluate` | Evaluates a context against active rules in priority order; returns the first match or a `review_required` fallback. |

## Claim Boundary Scanner (`/claim-boundary`)

| Method | Path | Description |
|---|---|---|
| POST | `/claim-boundary/scan` | Scans free text for restricted overclaiming phrases; returns flagged terms with positions and suggested replacements. |
| GET | `/claim-boundary/rules` | Returns the restricted-phrase list, safe replacements, and the term→replacement map. |

## Behavioral Signal Taxonomy (`/signals`)

| Method | Path | Description |
|---|---|---|
| GET | `/signals/taxonomy` | Returns the fixed 12-entry registry (K-01..K-04, L-01..L-04, T-01..T-04). |
| POST | `/signals/evaluate` | Maps a submitted `(code, value)` magnitude to a governance risk tier. |

## EIMM -- Maturity Model (`/eimm`)

| Method | Path | Description |
|---|---|---|
| GET | `/eimm/levels` | Returns the 5 maturity levels; Levels 4-5 marked `aspirational_only: true`. |
| POST | `/eimm/assess` | Scores submitted criteria against level requirements; always returns `certification_body_exists: false`. |

## Misc

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness/readiness check. |
| GET | `/` | Service metadata. |
| GET | `/docs` | Swagger UI. |
| GET | `/openapi.json` | Raw OpenAPI schema. |
