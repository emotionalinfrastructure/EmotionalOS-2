# CTP v0.1 -- Consent Token Protocol

Scoped, revocable, context-bound consent proof for behavioral or emotional
signal-related processing. Implemented in `apps/api/app/ctp/`.

## Token format

JWT, algorithm ES256 (EC P-256). Required claims:

```text
iss                 issuer URL
aud                 audience
sub                 subject (user identifier)
iat, exp             issued-at / expiry (exp - iat <= 300 seconds, enforced server-side)
jti                  UUIDv4, unique per token
scope                requested processing scope
purpose              declared purpose (checked against PDEV's approved-purpose list downstream)
context_hash         SHA-256 of the canonical context envelope
policy_uri           URI of the policy version in force at issuance
consent_level        e.g. "standard"
consent_version      must equal "ctp-0.1"
```

## Context envelope

Canonical JSON: sorted keys, no insignificant whitespace
(`json.dumps(obj, sort_keys=True, separators=(",", ":"))` server-side;
`packages/audit-ledger`'s `canonicalizeJson` client-side). Required
fields, and only these fields -- **no PII**:

```text
ts             ISO 8601 timestamp
channel        "voice" | "text" | "video"
features       list of feature names in use
processor      e.g. "on_device"
purpose        declared purpose
retention      retention policy label
jurisdiction   e.g. "US-CA"
ui_copy_id     identifier of the UI copy/disclosure shown to the user
nonce          per-issuance random value
```

`context_hash = SHA-256(canonical_json(context_envelope))`.

## Rules enforced by the implementation

- Token lifetime never exceeds 300 seconds, regardless of what a caller
  requests (`Settings.max_token_ttl_seconds`).
- `jti` is a UUIDv4, unique per token, and is the revocation key.
- Context hash mismatch, expiry, and revocation all deny.
- Scope/purpose mismatch (when the caller supplies an expected value)
  denies with 403.
- Every allow and deny writes a Dignity Ledger event
  (`pdev_action=ctp_validate` / `ctp_issue` / `ctp_revoke` / `ctp_process`).

## HTTP surface

See `docs/API_REFERENCE.md` -- `/ctp/issue`, `/ctp/validate`,
`/ctp/revoke`, `/ctp/introspect`, `/ctp/crl`, `/ctp/process`.

## Status

This is the v0.1 protocol as implemented in this reference implementation.
It has not been submitted to or reviewed by any external standards body.
