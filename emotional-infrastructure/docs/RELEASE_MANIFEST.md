# Release Manifest

**Project:** Emotional Infrastructure™ Governance Runtime
**Status:** Candidate governance architecture / reference implementation / developer prototype
**Version:** 0.1.0
**Prepared:** 2026-07-03
**Base branch commit:** `c65facc2fd5a1e8352202f1ef0c9142a3ec54c4d` (`main`, prior to this monorepo's addition)

This manifest describes exactly what this release contains and does not
contain. See `CLAIM_BOUNDARY.md` for language restrictions and
`VALIDATION_PLAN.md` for what has and has not been executed.

## Included

- **Backend** (`apps/api/`): FastAPI application implementing CTP, PDEV,
  EGL, TAR, Trajectory Governance, Dignity Ledger, Policy Engine, Claim
  Boundary Scanner, Behavioral Signal Taxonomy, and EIMM -- 33 real
  endpoints, 11 PostgreSQL models, Alembic migration + bootstrap schema
  creation, 41 passing pytest tests.
- **Frontend** (`apps/web/`): Next.js 14 App Router dashboard, 14 pages,
  all calling the live backend API, 6 passing vitest/@testing-library
  tests, verified end-to-end in a real browser session against a running
  backend.
- **SDK** (`packages/eis-sdk/` + `packages/shared-schemas/` +
  `packages/audit-ledger/` + `packages/policy-engine/`): TypeScript, ESM +
  CJS + type declarations, 40 passing vitest tests across the four
  packages, a dual-module (`require`/`import`) smoke test, and a runnable
  example (`examples/basic-flow.ts`).
- **Deployment**: `deployments/docker/docker-compose.yml` (validated with
  `docker compose config`, not yet run end-to-end -- see
  `VALIDATION_PLAN.md`) and `deployments/helm/ei-middleware/` (hand-reviewed,
  not yet rendered or deployed).
- **Documentation** (`docs/`): this file, `README.md`, `ARCHITECTURE.md`,
  `CLAIM_BOUNDARY.md`, `SECURITY.md`, `API_REFERENCE.md`,
  `VALIDATION_PLAN.md`, and the binding `EI_IMPLEMENTATION_SPEC_v1.0.md`.
- **Protocol spec** (`protocols/ctp-v0.1/`): the CTP v0.1 token format and
  rules as implemented.
- **Governance module docs** (`governance/*/README.md`): one page per
  module linking its written rules to its source code and tests.
- **Labs** (`labs/`): an EIOS Gateway prototype that fronts the API with
  CTP + PDEV enforcement, and a privacy-preserving analysis notebook over
  ledger exports.

## Explicitly not included / not claimed

- No certification, regulator approval, external audit, or clinical
  validation of any kind (see `CLAIM_BOUNDARY.md`).
- No production deployment history. Docker and Helm artifacts have not
  been run to completion in this authoring environment (see
  `VALIDATION_PLAN.md`).
- No real emotional inference. All "signal" inputs across EGL, the
  Behavioral Signal Taxonomy, and Trajectory Governance are either
  caller-supplied numeric magnitudes or system-event metadata -- never
  raw message content.
- No load/performance benchmark numbers.

## Source material provenance

This monorepo was built from five uploaded specification/checklist
markdown files (`EI_IMPLEMENTATION_SPEC_v1_1.md`,
`ACCEPTANCE_CHECKLIST_v1_1.md`, `EI_BINDING_DOCS_ALL_IN_ONE_v1_1.md`,
`MANIFEST_SHA256_v1_1.md`, `UPLOAD_MESSAGE_TO_PASTE.md`). The broader
source-material archive referenced in `MANIFEST_SHA256_v1_1.md` (prior SDK
releases, an "EIOS Gateway" zip, a "corrected" Helm chart zip, and various
PDFs) was **not** present in the upload for this session -- only its
manifest listing was. Where the instructions referenced "the corrected
uploaded chart" or "the strongest SDK version" as a base, this
implementation instead:

- Reused the pre-existing `eis-sdk` code already committed to this
  repository (`eis-sdk/src/consent/`, `eis-sdk/src/audit/`,
  `eis-sdk/src/repair/`) as the starting point for the SDK's consent,
  audit, and trust-repair logic, extended with the CTP/PDEV/TAR/
  Trajectory/claim-boundary/signal-tier functions the current spec
  requires.
  the current spec requires.
- Built the Helm chart fresh against the implementation spec's stated
  requirements (staging/production overlays, required placeholders for
  image tag, ingress host, CORS origin, and secrets), since no "corrected"
  chart file was available to adapt.

## Checksums

Run `sha256sum` over any file in this release to reproduce its digest;
none are pre-recorded here since the repository itself (via `git`) is the
integrity mechanism for this release, not a separate manifest file.
