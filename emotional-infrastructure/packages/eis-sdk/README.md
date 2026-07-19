# @emotional-infrastructure/eis-sdk

Developer SDK for the Emotional Infrastructure Governance Runtime -- a
**candidate governance architecture / reference implementation**, not a
certified or production-validated product. See
[`docs/CLAIM_BOUNDARY.md`](../../docs/CLAIM_BOUNDARY.md).

The SDK provides:

- Canonicalization and hashing primitives that byte-for-byte match the
  server's context-hash and Dignity Ledger hashing (`apps/api/app/security/hashing.py`,
  `apps/api/app/ledger/service.py`).
- Offline mirrors of the PDEV, TAR, and Trajectory Governance evaluators,
  for client-side pre-checks. **The server's endpoints remain
  authoritative** -- only the API can check live token revocation state.
- EGL signal-tier classification and the Claim Boundary Scanner, usable
  standalone or as a pre-flight before calling the API.

## Install (within this monorepo)

```bash
npm install
npm run build --workspace=packages/eis-sdk
```

## Usage

```ts
import {
  createConsentContext,
  hashConsentContext,
  classifySignalTier,
  evaluatePDEV,
  evaluateTAR,
  evaluateTrajectory,
  scanClaimBoundary,
  verifyLedgerHash,
  createCTID,
  createAuditEvent,
  calculateTrustDelta,
  evaluateToleranceWindow,
  validateConsentState,
  canonicalizeJson,
  sha256Hex,
} from "@emotional-infrastructure/eis-sdk";

const context = createConsentContext({
  channel: "text",
  processor: "on_device",
  purpose: "wellbeing_support",
  retention: "session_only",
  jurisdiction: "US-CA",
  uiCopyId: "checkin-prompt-v1",
});

const contextHash = hashConsentContext(context);

// After POST /ctp/issue, verify the response context_hash matches locally:
// contextHash === issueResponse.context_hash
```

See `examples/basic-flow.ts` for a complete offline walkthrough (run with
`npx tsx examples/basic-flow.ts`).

## Exports

`canonicalizeJson`, `sha256Hex`, `hmacSha256Hex`, `createCTID`,
`createConsentContext`, `hashConsentContext`, `validateConsentState`,
`evaluateToleranceWindow`, `calculateTrustDelta`, `createAuditEvent`,
`verifyLedgerHash`, `computeBlockHash`, `scanClaimBoundary`,
`classifySignalTier`, `evaluatePDEV`, `evaluateTAR`, `evaluateTrajectory`.

## Build targets

Both ESM (`dist/index.mjs`) and CJS (`dist/index.cjs`) are built by `tsup`,
with type declarations (`dist/index.d.ts`).

## Testing

```bash
npm run test --workspace=packages/eis-sdk        # unit tests (vitest)
npm run verify --workspace=packages/eis-sdk       # typecheck + test + build + dual-module import check
```

## Known limitations

This SDK does not perform real emotional inference and does not itself
enforce governance -- it mirrors the server's deterministic logic for
client-side convenience. The API (`apps/api`) is the source of truth for
every allow/deny/review decision and the only writer of Dignity Ledger
events.
