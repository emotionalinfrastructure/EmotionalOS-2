# Launch Gates

Backed by the `LaunchGateRecord` model (`apps/api/app/models.py`). Every
`POST /eimm/assess` call writes a `LaunchGateRecord` row
(`gate_name="eimm_assessment"`) capturing the domain, computed maturity
level, per-criterion pass/fail, and the same claim-boundary disclaimer
returned in the API response -- see `apps/api/app/eimm/service.py`.

## What a launch gate record contains

```text
gate_name        e.g. "eimm_assessment"
domain           caller-supplied label
status            "pass" (level >= 3) | "review_required"
score             satisfied criteria / total criteria
maturity_level    1-5
criteria          the submitted criteria dict, verbatim
notes             the claim-boundary disclaimer text
evaluated_at      timestamp
```

## Relationship to EIMM

See [`../../docs/EI_IMPLEMENTATION_SPEC_v1.0.md`](../../docs/EI_IMPLEMENTATION_SPEC_v1.0.md)
section 16 for the maturity levels themselves. Launch gates are the
persisted record of an EIMM self-assessment, not a separate go/no-go
authority -- there is no separate approval workflow layered on top of them
in this reference implementation.
