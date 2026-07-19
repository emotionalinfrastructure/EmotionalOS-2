# Claim Boundary

This document is the single source of truth for how this project may and
may not be described. The Claim Boundary Scanner (`apps/api/app/claim_boundary/`,
`packages/eis-sdk` `scanClaimBoundary`) enforces the same list
programmatically -- both are generated from the same restricted-phrase
table so they cannot drift.

## May describe this project as

- a reference implementation
- a developer MVP
- a candidate governance architecture
- a validation-ready prototype
- a proposed technical framework
- a governance runtime
- a pilot implementation

## Must not describe this project as

- certified
- production-ready
- legally compliant
- regulator-approved
- externally audited
- clinically validated
- benchmark-proven
- standards-body adopted
- guaranteed compliance software

## Restricted phrase → suggested replacement

| Restricted | Suggested replacement |
|---|---|
| certified | reference implementation |
| regulator-approved | candidate architecture (not yet regulator-reviewed) |
| legally compliant | designed to align with (not a legal-compliance claim) |
| clinically validated | developer prototype (not clinically validated) |
| externally audited | not yet externally audited |
| production-ready | developer prototype |
| benchmark-proven | validation-ready (no benchmark claims made) |
| standards-body adopted | proposed technical framework |
| guaranteed compliant | validation-ready (compliance not guaranteed) |
| proven compliance | candidate architecture (compliance not proven) |

## Performance and maturity claims

Performance targets may appear only as targets, never as measured results,
unless tests have actually been executed, raw data archived, sample sizes
recorded, and confidence intervals calculated. This repository's own test
results (41 backend tests, 40 package tests, 6 frontend tests, all
passing at time of writing -- see `docs/VALIDATION_PLAN.md`) are reported
as exactly that: test results, not a benchmark, certification, or
external validation.

EIMM (`/eimm/levels`, `/eimm/assess`) Levels 4 (Validated) and 5
(Movement-Led) are aspirational maturity targets. No certification
authority, criteria board, or audit process exists for this project; an
EIMM self-assessment can never itself constitute certification, and the
API response always sets `certification_body_exists: false` regardless of
which criteria are marked satisfied.

## Enforcement

Any uploaded or authored material that uses overclaiming language
("certified," "production-grade," "compliant," "validated," etc.) should
be rewritten using the safe-replacement column above unless real,
citable, external evidence is attached. `POST /claim-boundary/scan` and
the SDK's `scanClaimBoundary` exist to make this a mechanical check, not a
matter of authorial discretion.
