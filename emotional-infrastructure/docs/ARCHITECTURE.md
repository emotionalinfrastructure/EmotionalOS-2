# Architecture

## Overview

The runtime is a modular control stack. Every module writes its decisions
to a single, hash-chained Dignity Ledger; nothing acts on emotional or
behavioral signal metadata without passing through a consent check.

```text
                     ┌──────────────────────┐
   client / SDK ───▶ │  CTP (consent tokens) │
                     └──────────┬────────────┘
                                │ token + context envelope
                                ▼
                     ┌──────────────────────┐
                     │   PDEV middleware     │  Purpose / Dignity / Evidence / Veto
                     └──────────┬────────────┘
                                │
                 ┌──────────────┼───────────────┐
                 ▼              ▼               ▼
          ┌───────────┐  ┌────────────┐  ┌─────────────┐
          │    EGL     │  │    TAR     │  │ Trajectory  │
          │ (signal    │  │ (inference │  │ Governance  │
          │  tiers,    │  │  != auth)  │  │ (system-    │
          │  breaker)  │  │            │  │  level only)│
          └─────┬──────┘  └─────┬──────┘  └──────┬──────┘
                │               │                │
                └───────────────┼────────────────┘
                                 ▼
                     ┌──────────────────────┐
                     │    Policy Engine      │  rule-based final decision
                     └──────────┬────────────┘
                                ▼
                     ┌──────────────────────┐
                     │   Dignity Ledger™     │  append-only, hash-chained
                     └──────────────────────┘
```

`Claim Boundary Scanner`, `Behavioral Signal Taxonomy`, and `EIMM` are
peers of this chain, not part of the request path: they govern public
language, provide the fixed signal registry, and produce a maturity
self-assessment, respectively.

## Backend module map (`apps/api/app/`)

| Module | Responsibility |
|---|---|
| `security/` | EC key management (`keys.py`), ES256 JWT sign/verify (`jwt_service.py`), canonical JSON + SHA-256/HMAC (`hashing.py`) |
| `ctp/` | Token issue/validate/revoke/introspect/CRL/process |
| `pdev/` | Purpose, Dignity, Evidence, Veto gate evaluation |
| `egl/` | Signal-tier classification, dynamic circuit breaker, consent step-up |
| `tar/` | Time-boxed authorization separate from inference |
| `trajectory/` | System-event-pattern longitudinal evaluation |
| `ledger/` | Hash-chain append/verify/export -- called directly (in-process) by every other module, not just over HTTP |
| `policy/` | Rule registry + condition matcher + evaluate endpoint |
| `claim_boundary/` | Restricted-phrase scanner |
| `signals/` | Behavioral Signal Taxonomy registry + risk-tier mapping |
| `eimm/` | Maturity self-assessment |

`models.py` holds the 11 SQLAlchemy models named in the implementation
spec (`ConsentRecord`, `ConsentTokenRecord`, `RevokedToken`, `PolicyRule`,
`PDEVDecision`, `EGLSignalEvent`, `TARAuthorization`,
`TrajectoryEvaluation`, `DignityLedgerEvent`, `ClaimBoundaryScan`,
`LaunchGateRecord`). Schema is created either by Alembic
(`apps/api/alembic/`) or by the idempotent `bootstrap_schema()` call the
app runs on startup -- both are wired to the same `Base.metadata`.

## Design decisions worth calling out

- **Ledger hashing is reproducible from stored columns alone.** `append_event`
  builds a payload dict from named fields (never a serialized blob), hashes
  `canonical_json(payload) + previous_block_hash`, and `verify_chain`
  rebuilds the same payload from the same columns to recompute and compare.
  This is what makes "every allow/deny decision reproducible from stored
  fields" true rather than aspirational.
- **`sequence` is assigned in application code**, not a DB identity column,
  so the hash-chain append and the sequence assignment happen in one
  Python-level operation instead of racing a database sequence.
- **TAR treats an inference reference as evidence, never authorization.**
  `evaluate()` always checks a live `TARAuthorization` row's `status` and
  `expires_at`; there is no code path where an inference by itself unlocks
  an action.
- **Trajectory Governance never reads message content.** Its inputs are
  `SystemEvent{type, actor, ts}` tuples and a `centrality_trend` label --
  deliberately too coarse to reconstruct a conversation or a psychological
  profile.
- **The SDK mirrors, not replaces, the server.** `evaluatePDEV`,
  `evaluateTAR`, and `evaluateTrajectory` in `packages/eis-sdk` implement
  the same deterministic logic as their Python counterparts for offline
  pre-checks, but only the API can see live revocation state, so it stays
  authoritative.

## Frontend (`apps/web/`)

Next.js App Router, one route per governance capability (14 total, see
`docs/README.md`). All pages are client components that call the FastAPI
backend directly through `lib/api.ts`; the only exception is the Docs
Viewer, which additionally reads `docs/*.md` through a same-origin Next.js
route handler (`app/api/docs/route.ts`) so the dashboard can render the
project's real documentation instead of a hardcoded string.

## Deployment

`deployments/docker/docker-compose.yml` builds `apps/api/Dockerfile` and
`apps/web/Dockerfile` from the monorepo root (needed for npm workspaces)
and wires them to `postgres` and an unused-by-default `redis`.
`deployments/helm/ei-middleware/` mirrors the same two services plus an
optional in-chart Postgres `StatefulSet`, with `values-staging.yaml` /
`values-production.yaml` overlays that intentionally leave image tags,
ingress host, CORS origin, and secrets as required placeholders.
