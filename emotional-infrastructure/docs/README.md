# Emotional Infrastructure™ Governance Runtime

**Candidate governance architecture / reference implementation / developer
prototype.** Not certified, not production-validated, not externally
audited, not regulator-approved, not clinically validated. See
[`CLAIM_BOUNDARY.md`](./CLAIM_BOUNDARY.md).

A working developer reference implementation for AI-mediated trust
governance: Consent Token Protocol (CTP), PDEV middleware (Purpose,
Dignity, Evidence, Veto), the Emotional Governance Layer (EGL), Temporal
Affective Regulation (TAR), Trajectory Governance, the Dignity Ledger™,
a Behavioral Signal Taxonomy, a rule-based Policy Engine, a Claim Boundary
Scanner, and the EIS SDK.

## Monorepo layout

```text
emotional-infrastructure/
├── apps/api/           FastAPI backend -- all governance logic and persistence
├── apps/web/            Next.js governance dashboard (14 pages)
├── apps/public-site/    Static public-facing project page
├── packages/eis-sdk/    TypeScript SDK (ESM + CJS)
├── packages/shared-schemas/  Shared TS types/zod schemas
├── packages/audit-ledger/    Canonicalization/hashing/ledger-verify primitives
├── packages/policy-engine/   Client-side port of the policy rule matcher
├── protocols/ctp-v0.1/  CTP protocol specification
├── governance/          Per-module governance documentation
├── labs/                EIOS gateway prototype + privacy notebooks
├── deployments/docker/  docker-compose.yml
├── deployments/helm/    ei-middleware Helm chart
├── docs/                This documentation set
└── tests/               Cross-cutting acceptance notes
```

## Quick start (local, no Docker)

### 1. Backend

Requires Python 3.11+ and a running PostgreSQL instance.

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

createuser ei --pwprompt   # or use an existing role; set password to "ei" for the defaults below
createdb emotional_infrastructure -O ei

export EI_DATABASE_URL="postgresql+psycopg://ei:ei@localhost:5432/emotional_infrastructure"
alembic upgrade head        # or just start the app -- it bootstraps the schema on startup too

uvicorn app.main:app --reload --port 8000
```

- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### 2. Frontend

Requires Node.js 18+.

```bash
npm install                      # from the emotional-infrastructure/ root (npm workspaces)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev:web
```

- Dashboard: http://localhost:3000

### 3. SDK

```bash
npm run build:packages   # builds shared-schemas, audit-ledger, policy-engine, eis-sdk
npm run test:packages    # runs each package's test suite
```

## Docker Compose

```bash
cd deployments/docker
docker compose up --build
```

Starts `postgres`, `redis` (optional, unused by the API by default), `api`
(port 8000), and `web` (port 3000). `api` waits for Postgres to become
healthy, then runs Alembic migrations, then starts Uvicorn.

## Tests

```bash
# Backend (41 tests): CTP token lifecycle, PDEV gates, EGL tiers/breaker/
# step-up, TAR authorization, Trajectory Governance, Dignity Ledger
# append/verify/tamper-detection, Policy Engine, Claim Boundary Scanner.
cd apps/api && source .venv/bin/activate && python -m pytest -q

# TypeScript packages (40 tests across shared-schemas, audit-ledger,
# policy-engine, eis-sdk)
npm run test:packages

# Frontend (6 tests): dashboard renders + calls the API, issue/validate
# token pages call the API, ledger page loads real events, claim scanner
# renders flagged terms.
npm run test --workspace=apps/web
```

## API route summary

See [`API_REFERENCE.md`](./API_REFERENCE.md) for the full list. Highlights:

| Module | Endpoints |
|---|---|
| CTP | `POST /ctp/{issue,validate,revoke,introspect,process}`, `GET /ctp/crl` |
| PDEV | `POST /pdev/evaluate` |
| EGL | `POST /egl/{classify-signal,evaluate-circuit-breaker,consent-step-up}` |
| TAR | `POST /tar/{authorize,evaluate,expire}`, `GET /tar/authorizations/{id}` |
| Trajectory | `POST /trajectory/evaluate`, `GET /trajectory/evaluations[/{id}]` |
| Ledger | `POST/GET /ledger/events`, `GET /ledger/{verify,export.json,export.csv}` |
| Policy | `GET/POST /policy/rules`, `PATCH /policy/rules/{id}`, `POST /policy/evaluate` |
| Claim Boundary | `POST /claim-boundary/scan`, `GET /claim-boundary/rules` |
| Signals | `GET /signals/taxonomy`, `POST /signals/evaluate` |
| EIMM | `GET /eimm/levels`, `POST /eimm/assess` |

## Frontend route summary

`/` (dashboard), `/ctp/issue`, `/ctp/validate`, `/ctp/revoke`,
`/ctp/process`, `/pdev`, `/egl`, `/tar`, `/trajectory`, `/ledger`,
`/policy`, `/claim-boundary`, `/eimm`, `/docs`. Every page calls the real
backend API; there are no static-only demo screens.

## SDK usage example

```ts
import { createConsentContext, hashConsentContext, evaluatePDEV } from "@emotional-infrastructure/eis-sdk";

const context = createConsentContext({
  channel: "text",
  processor: "on_device",
  purpose: "wellbeing_support",
  retention: "session_only",
  jurisdiction: "US-CA",
  uiCopyId: "checkin-prompt-v1",
});

console.log(hashConsentContext(context)); // matches the server's context_hash for this envelope
```

See `packages/eis-sdk/README.md` and `packages/eis-sdk/examples/basic-flow.ts`.

## Known limitations

- Not production validated, not legally certified, not regulator approved,
  not externally audited, not clinically validated.
- Does not perform real emotional inference. It governs submitted signal
  metadata, consent tokens, policy rules, temporal authorization,
  trajectory summaries, and audit records -- see each module's MVP boundary
  in `docs/EI_IMPLEMENTATION_SPEC_v1.0.md`.
- Not a substitute for a DPIA, legal review, or independent security audit.
- The Helm chart's Kubernetes deployment has not been executed against a
  real cluster in this reference implementation -- see
  `deployments/helm/ei-middleware/README.md`.
- `next@14.x` carries several published advisories with fixes only in
  `next@16` at time of writing; see `docs/SECURITY.md`.

## Next implementation phase

1. Independent security review of the CTP signing/revocation flow and the
   Dignity Ledger hash chain.
2. Replace the in-repo EC key generation with a KMS-backed signer for any
   non-local deployment.
3. Execute `helm lint` / `helm template` and a real `helm install` against
   a disposable cluster; record the results in `VALIDATION_PLAN.md`.
4. Expand the Behavioral Signal Taxonomy's threshold calibration with real
   (consented, aggregated) usage data before treating tier boundaries as
   anything more than illustrative defaults.
5. Upgrade `next` to a version without open DoS/XSS advisories once a
   compatibility pass has been done against this app's routes.
