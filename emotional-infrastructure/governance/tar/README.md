# TAR -- Temporal Affective Regulation

Implementation: `apps/api/app/tar/`. Endpoints: `POST /tar/authorize`,
`POST /tar/evaluate`, `POST /tar/expire`, `GET /tar/authorizations/{id}`.
Client-side mirror: `packages/eis-sdk` `evaluateTAR`.

## Principle

**Inference is not authorization.** The system may record that an
inference reference exists (`inference_ref`, an opaque label, never raw
content), but it may not act on it unless a live, unexpired
`TARAuthorization` row says so.

## Evaluation

`POST /tar/evaluate` checks, in order:

1. Does the authorization exist? (404-equivalent -> `deny`)
2. Is `now <= expires_at` and `status == "active"`? If not -> `expired`,
   `reauthorization_required: true`.
3. Is the requested action's risk rank <= the authorized risk rank
   (`low < medium < high < irreversible`)? If it exceeds it:
   - and escalation was both requested and pre-approved -> `review_required`
   - otherwise -> `reauthorization_required`
4. Otherwise -> `allow`.

## Tests

`apps/api/app/tests/test_tar.py` -- within-scope allow, expired
(real 1-second-TTL sleep test), reauthorization-required on risk
escalation, escalation-allowed review path, manual expire, unknown
authorization.
