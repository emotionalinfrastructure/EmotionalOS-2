# Validation Plan

This document distinguishes what has actually been executed and observed
in this reference implementation from what remains open. It is not a
certification, audit report, or compliance attestation -- see
`CLAIM_BOUNDARY.md`.

## What has been executed in this session

| Check | Method | Result |
|---|---|---|
| Backend starts locally | `uvicorn app.main:app` against a local Postgres | Started; `/health` returned `{"status":"ok",...}` |
| PostgreSQL connects | psql + SQLAlchemy engine | Connected; 11 application tables + `alembic_version` created |
| Schema created by migration | `alembic revision --autogenerate` + `alembic upgrade head` against an empty schema | Succeeded; all 11 tables created |
| Schema created by bootstrap | App startup `bootstrap_schema()` (`Base.metadata.create_all`) | Succeeded (used by the Docker image and local dev by default) |
| CTP issue/validate/revoke/process flow | Manual `curl` + pytest | Issue → allow; tampered context → 400; revoke → subsequent validate → 401 `revoked` |
| PDEV gate evaluation | pytest (`app/tests/test_pdev.py`) + manual `curl` | Pass/fail/review/vetoed cases all produced the expected gate breakdown |
| EGL Tier 3 hard block | pytest (`app/tests/test_egl.py`) + manual `curl` | Tier 3 → `deny` + circuit breaker `hard_block` |
| EGL Tier 2 + irreversible step-up | pytest + manual `curl` | `pending` when unconfirmed, `approved` when confirmed |
| TAR expired authorization | pytest (`app/tests/test_tar.py`), including a live 1-second-TTL sleep test | `expired` + `reauthorization_required: true` |
| Trajectory insufficient data / substitution | pytest (`app/tests/test_trajectory.py`) | Below 5 events → `insufficient_data`; substitution-heavy sample → `substitution` + `block_escalation` |
| Ledger append + hash chain | pytest (`app/tests/test_ledger.py`) + standalone script | Chain links verified; a single mutated field was detected by `/ledger/verify` |
| Ledger verify (tamper detection) | pytest + manual mutation via SQLAlchemy | `valid: false`, correct `first_invalid_event_id` |
| Claim Boundary Scanner flags overclaims | pytest + manual `curl` + browser | "certified" / "production-ready" flagged with suggested replacements |
| Policy Engine rule evaluation | pytest (`app/tests/test_policy.py`) | Default rules seeded; priority-ordered matching confirmed |
| Backend test suite | `python -m pytest -q` | **41 passed** |
| SDK build (ESM + CJS + types) | `npm run build --workspace=packages/eis-sdk` | `dist/index.mjs`, `dist/index.cjs`, `dist/index.d.ts` all produced |
| SDK dual-module import check | `node scripts/verify-dual-module.mjs` | Both `require()` and `import()` succeeded against the built output |
| Package test suites | `npm run test:packages` | **40 passed** (shared-schemas 6, audit-ledger 6, policy-engine 5, eis-sdk 23) |
| Frontend build | `next build` | Compiled successfully; 14 static-shell routes generated |
| Frontend test suite | `npm run test --workspace=apps/web` | **6 passed** |
| Frontend end-to-end (browser) | Playwright against `next start` + a live backend | Dashboard loaded; Issue Token → real JWT; Validate Token → `allow`; Ledger page verify → chain valid; Claim Boundary Scanner → flagged "certified" |
| Docker Compose syntax | `docker compose config` | Valid; resolved services match the intended `postgres`/`redis`/`api`/`web` topology |

## What has not been executed

- **`docker compose up --build`** end-to-end. The Docker daemon was not
  available in the environment this was authored in (`dockerd` could not
  start: `ulimit: error setting limit (Operation not permitted)`). The
  Dockerfiles and compose file were reviewed by hand and the compose file
  was validated with `docker compose config`, but the images have not
  actually been built or run.
- **`helm lint` / `helm template` / `helm install`.** The `helm` CLI was
  not installable in this environment (outbound access to `get.helm.sh`
  was blocked by the network policy). The chart follows conventional Helm
  patterns and was reviewed by hand, but has not been rendered or deployed.
- Any third-party security audit, penetration test, or DPIA.
- Load testing / benchmarking of any kind. No performance numbers in this
  repository should be read as measured results.
- Multi-instance / multi-region revocation consistency testing (see
  `SECURITY.md`).

## Test coverage matrix (backend, from the implementation spec's required list)

| Requirement | Covered by |
|---|---|
| Valid token allows | `app/ctp/tests.py::test_valid_token_allows` |
| Expired token denies | `app/ctp/tests.py::test_expired_token_denies` |
| Revoked token denies | `app/ctp/tests.py::test_revoked_token_denies` |
| Malformed token denies | `app/ctp/tests.py::test_malformed_token_denies` |
| Context hash mismatch denies | `app/ctp/tests.py::test_context_hash_mismatch_denies` |
| Scope mismatch denies | `app/ctp/tests.py::test_scope_mismatch_denies` |
| Purpose mismatch denies | `app/ctp/tests.py::test_purpose_mismatch_denies` |
| PDEV pass | `app/tests/test_pdev.py::test_pdev_pass_allows` |
| PDEV fail | `app/tests/test_pdev.py::test_pdev_fail_no_token_denies` |
| EGL Tier 2 consent step-up | `app/tests/test_egl.py::test_egl_tier2_consent_step_up_required` |
| EGL Tier 3 hard block | `app/tests/test_egl.py::test_egl_tier3_hard_block` |
| TAR expired authorization | `app/tests/test_tar.py::test_tar_expired_authorization_denies` |
| TAR reauthorization required | `app/tests/test_tar.py::test_tar_reauthorization_required_on_risk_escalation` |
| Trajectory insufficient data | `app/tests/test_trajectory.py::test_trajectory_insufficient_data` |
| Trajectory substitution warning | `app/tests/test_trajectory.py::test_trajectory_substitution_warning` |
| Ledger append | `app/tests/test_ledger.py::test_ledger_append_via_api` |
| Ledger verify | `app/tests/test_ledger.py::test_ledger_verify_passes_on_untouched_chain`, `test_ledger_verify_detects_tampering` |
| Policy rule evaluation | `app/tests/test_policy.py` |
| Claim boundary scan | `app/tests/test_claim_boundary.py` |

## Next validation steps

1. Get a `docker compose up --build` run recorded (with logs) in an
   environment with Docker daemon access.
2. Get `helm lint` and a `helm template --debug` dry run recorded, then a
   real `helm install` against a disposable cluster (e.g. kind/minikube).
3. Commission an independent security review focused on the CTP signing
   key lifecycle and the Dignity Ledger's tamper-evidence guarantees
   (see `SECURITY.md`'s "what this does not do").
4. Any real-world signal-tier threshold calibration must be done with
   consented, aggregated usage data -- the current thresholds in
   `egl/service.py` are illustrative defaults, not derived from data.
