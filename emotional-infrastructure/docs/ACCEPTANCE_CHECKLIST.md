# Acceptance Checklist — Emotional Infrastructure™ Governance Runtime

The build is not acceptable unless all of the following are true:

## Backend

- [ ] FastAPI backend starts locally.
- [ ] PostgreSQL connects successfully.
- [ ] Database tables are created by migration or bootstrap.
- [ ] `/ctp/issue` creates a signed JWT.
- [ ] `/ctp/validate` validates a real token.
- [ ] Expired token denies.
- [ ] Revoked token denies.
- [ ] Context hash mismatch denies.
- [ ] Scope mismatch denies.
- [ ] Purpose mismatch denies.
- [ ] `/ctp/process` blocks processing without valid consent.
- [ ] `/pdev/evaluate` returns real Purpose, Dignity, Evidence, Veto gate results.
- [ ] `/egl/classify-signal` maps submitted metadata to governance tiers.
- [ ] `/egl/evaluate-circuit-breaker` returns real governance actions.
- [ ] EGL Tier 3 causes hard block.
- [ ] EGL Tier 2 plus irreversible action requires consent step-up.
- [ ] `/tar/evaluate` separates inference from authorization.
- [ ] Expired TAR authorization denies or requires reauthorization.
- [ ] `/trajectory/evaluate` evaluates system-level event patterns only.
- [ ] `/ledger/events` writes real hash-chained ledger records.
- [ ] `/ledger/verify` verifies chain continuity.
- [ ] `/claim-boundary/scan` flags restricted claims.
- [ ] `/eimm/assess` returns maturity result with claim boundaries.

## Frontend

- [ ] Next.js frontend starts locally.
- [ ] Dashboard calls backend.
- [ ] Issue token page calls `/ctp/issue`.
- [ ] Validate token page calls `/ctp/validate`.
- [ ] Revoke token page calls `/ctp/revoke`.
- [ ] PDEV page calls `/pdev/evaluate`.
- [ ] EGL page calls EGL endpoints.
- [ ] TAR page calls TAR endpoints.
- [ ] Trajectory page calls trajectory endpoint.
- [ ] Ledger page loads real ledger events.
- [ ] Claim scanner page calls claim-boundary endpoint.

## SDK

- [ ] SDK builds successfully.
- [ ] SDK has ESM output.
- [ ] SDK has CJS output.
- [ ] SDK tests pass.
- [ ] Exports include canonicalizeJson, sha256Hex, createCTID, verifyLedgerHash, scanClaimBoundary, classifySignalTier, evaluatePDEV, evaluateTAR, and evaluateTrajectory.

## Deployment

- [ ] Docker Compose starts API, frontend, and database.
- [ ] Backend docs load at `http://localhost:8000/docs`.
- [ ] Frontend loads at `http://localhost:3000`.
- [ ] `.env.example` exists and is accurate.
- [ ] Helm chart is organized under `deployments/helm/ei-middleware/`.

## Quality and claim discipline

- [ ] No TODO placeholder implementation remains.
- [ ] No fake benchmark results.
- [ ] No claims of certification, legal compliance, production readiness, external audit, clinical validation, or regulator approval.
- [ ] README commands work.
- [ ] All tests pass.
