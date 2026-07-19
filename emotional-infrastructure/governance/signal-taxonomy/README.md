# Behavioral Signal Taxonomy

Implementation: `apps/api/app/signals/`. Endpoints: `GET /signals/taxonomy`,
`POST /signals/evaluate`.

## Registry

| Family | Codes |
|---|---|
| Kinetic and Kinematic | K-01 Keystroke Dynamics, K-02 Pressure/Force, K-03 Cursor Pathing, K-04 Dwell Time |
| Syntactic and Linguistic | L-01 Qualifier Density, L-02 Deletional Editing, L-03 Pronominal Shift, L-04 Syntactic Complexity |
| Temporal and Process | T-01 Latency Response, T-02 Session Velocity, T-03 Burstiness, T-04 Circadian Deviation |

## MVP boundary

The API does not infer real mental states. Callers submit a signal code
and a pre-computed 0-1 magnitude; `signals/rules.py::magnitude_to_tier`
maps that magnitude to a governance risk tier (0-2) via fixed thresholds.
It does not diagnose, profile, or clinically label anyone -- there is no
code path from a signal value to a clinical or psychological label
anywhere in this module.

## Tests

`apps/api/app/tests/test_signals.py`.
