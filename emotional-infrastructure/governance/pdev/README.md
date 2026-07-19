# PDEV -- Purpose, Dignity, Evidence, Veto

Implementation: `apps/api/app/pdev/`. Endpoint: `POST /pdev/evaluate`.
Client-side offline mirror: `packages/eis-sdk` `evaluatePDEV`.

## Gates

**Purpose** -- exists, is in the approved-purpose set
(`app/governance_constants.py::APPROVED_PURPOSES`), matches the presented
consent token's `purpose` claim, and the requested feature is in that
purpose's allowlist (`PURPOSE_FEATURE_ALLOWLIST`).

**Dignity** -- fails on a Tier 3 (manipulation-vector) signal, on an
explicit hidden-steering flag, or on a high-risk/irreversible action taken
under Tier 2 (vulnerability markers) without a confirmed consent step-up.

**Evidence** -- a consent token must be presented, must decode/verify
(not expired, not malformed, not revoked), and (if a context envelope is
supplied) its hash must match the token's `context_hash`.

**Veto** -- fails if the caller explicitly requests a veto, or if the
presented token has been revoked.

## Decision combination

```text
veto fails                         -> vetoed
evidence or purpose fails          -> deny
dignity fails (tier3/steering)     -> deny
dignity fails (missing step-up)    -> review_required
otherwise                          -> allow
```

## Tests

`apps/api/app/tests/test_pdev.py` -- pass, no-token-fail, tier3-deny,
step-up-required-review, veto-requested cases.
