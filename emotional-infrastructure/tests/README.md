# Cross-cutting test notes

Test suites live next to the code they test (so they run inside the right
toolchain/venv/workspace): `apps/api/app/tests/` + `apps/api/app/ctp/tests.py`
(pytest), `apps/web/__tests__/` (vitest + Testing Library),
`packages/*/test/` (vitest), `labs/eios-gateway/tests/` and
`labs/privacy-notebooks/tests/` (pytest). This directory holds the
cross-cutting summary rather than duplicate test code.

## Run everything

```bash
# Backend (41 tests)
cd apps/api && source .venv/bin/activate && python -m pytest -q

# TypeScript packages (40 tests: shared-schemas, audit-ledger, policy-engine, eis-sdk)
npm run test:packages

# Frontend (6 tests)
npm run test --workspace=apps/web

# Lab prototypes (8 tests)
cd labs/eios-gateway && ../../apps/api/.venv/bin/python -m pytest tests/ -q
cd labs/privacy-notebooks && ../../apps/api/.venv/bin/python -m pytest tests/ -q
```

## Acceptance checklist mapping

See [`../docs/VALIDATION_PLAN.md`](../docs/VALIDATION_PLAN.md) for the
full requirement-by-requirement mapping to specific test names, and
[`../docs/ACCEPTANCE_CHECKLIST.md`](../docs/ACCEPTANCE_CHECKLIST.md) for
the checklist this implementation was built against.
