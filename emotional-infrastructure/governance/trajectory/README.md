# Trajectory Governance

Implementation: `apps/api/app/trajectory/`. Endpoint: `POST
/trajectory/evaluate`, `GET /trajectory/evaluations[/{id}]`. Client-side
mirror: `packages/eis-sdk` `evaluateTrajectory`.

## Privacy rule

This module evaluates **system-level event patterns only**: a list of
`{type, actor, ts}` tuples plus a coarse `centrality_trend` label. It never
inspects raw conversation content, never infers clinical state, and never
builds a psychological profile. This is enforced by the input schema
itself (`trajectory/schemas.py::SystemEvent`), not by a downstream filter.

## Dimensions evaluated

- **Attenuation** -- does system centrality trend down/stable
  (`pass`) or up (`fail`)?
- **Proportionality** -- is the ratio of `task_substitution` events to
  total events within bounds?
- **Contestability** -- has the user ever overridden, contested, or
  vetoed a system action in the window?
- **Symmetry of adaptation** -- what fraction of events were
  user-initiated vs. system-initiated?

Below 5 events, the module reports `insufficient_data` and all four
conditions as `unknown` -- it does not guess.

## Status mapping

```text
substitution_ratio > 0.5                          -> substitution
attenuation=fail AND symmetry=fail                 -> possible_benevolent_capture
substitution_ratio <= 0.2 AND attenuation=pass     -> stable_support
otherwise                                          -> scaffolding
```

## Tests

`apps/api/app/tests/test_trajectory.py` -- insufficient data, substitution
warning, stable support, list/get endpoints.
