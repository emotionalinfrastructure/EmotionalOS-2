# Claim Boundary Scanner

Implementation: `apps/api/app/claim_boundary/`. Endpoints: `POST
/claim-boundary/scan`, `GET /claim-boundary/rules`. Client-side mirror:
`packages/eis-sdk` `scanClaimBoundary`.

See [`docs/CLAIM_BOUNDARY.md`](../../docs/CLAIM_BOUNDARY.md) for the full
restricted-phrase table and the rules this module and document are both
generated from (`claim_boundary/rules.py::RESTRICTED_PHRASE_REPLACEMENTS`
is the single source of truth).

## Behavior

`POST /claim-boundary/scan` case-insensitively matches every restricted
phrase in submitted text, returns each match's position and a suggested
claim-disciplined replacement, and persists the scan
(`ClaimBoundaryScan` model) for audit purposes -- it does not store or
transmit the scan anywhere external.

## Tests

`apps/api/app/tests/test_claim_boundary.py` -- flags known overclaims,
passes claim-disciplined text, rules endpoint returns the full map.
