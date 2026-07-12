# Security

This is a candidate governance architecture / reference implementation.
It has **not** undergone independent security review, penetration testing,
or a DPIA. Treat everything below as "what the code currently does," not
as a security certification.

## Token signing and keys

- CTP tokens are JWTs signed with ES256 (EC P-256), via `apps/api/app/security/keys.py`
  and `jwt_service.py`.
- On first startup, if no key pair exists at `EI_KEY_DIR` (default
  `apps/api/var/keys/`), one is generated and persisted (PEM, PKCS8, no
  password). Restarting the process reuses the same key so previously
  issued tokens keep verifying for their (<=300s) lifetime.
- **This is a local-development key management approach.** For any shared
  or long-lived deployment, replace it with a KMS-backed signer
  (e.g. cloud KMS asymmetric signing, or a proper PKI) instead of a
  file on local/PVC storage.
- Token lifetime is hard-capped at 300 seconds server-side
  (`Settings.max_token_ttl_seconds`) regardless of what a caller requests.

## Revocation

- Revocation is tracked in two ways: a `revoked` flag + timestamp on
  `ConsentTokenRecord`, and a dedicated `RevokedToken` table used for the
  CRL (`GET /ctp/crl`). `/ctp/validate`, `/ctp/process`, and `/pdev/evaluate`
  all check both.
- There is no distributed cache/CRL propagation model here -- revocation
  checks hit the same Postgres instance the API is bound to. A
  multi-region or multi-instance deployment needs a shared revocation
  store (this database, or a real CRL/OCSP-style service) with adequate
  read consistency guarantees; this has not been engineered or tested.

## Ledger integrity

- The Dignity Ledger is hash-chained (SHA-256 of canonical JSON + previous
  block hash) and optionally HMAC-signed with `EI_LEDGER_HMAC_SECRET`.
- This provides **tamper-evidence**, not tamper-*proofing*: anyone with
  direct database write access and the HMAC secret could still forge a
  self-consistent chain. There is no external anchor (e.g. a separate
  append-only log, blockchain notarization, or write-once storage) in
  this reference implementation.
- `GET /ledger/verify` detects any single-field mutation or broken chain
  link; it does not detect a fully-regenerated, internally-consistent
  forged chain by an attacker with both DB and secret access.

## Secrets handling

- `.env.example` documents required environment variables; none of the
  values in it are real secrets.
- The Helm chart (`deployments/helm/ei-middleware/`) expects
  `secrets.existingSecretName` to point at an operator-managed Kubernetes
  `Secret` in staging/production; it will otherwise template one from
  `values.yaml`, which is explicitly a local/dev-only fallback (see
  `templates/secret.yaml`).
- `EI_LEDGER_HMAC_SECRET` and the database password must be rotated before
  any deployment beyond local development.

## CORS

- `EI_CORS_ORIGINS` (comma-separated) controls `CORSMiddleware`'s allowed
  origins; the default is `http://localhost:3000` for local development.
  Set this explicitly per environment -- do not use `*` in any shared
  deployment.

## Known dependency vulnerabilities

- `next@14.2.35` (the newest 14.x release available at authoring time)
  still carries several published advisories (DoS via Server Components,
  cache poisoning, middleware/proxy issues) whose fixes landed in
  `next@16`. This app does not use `next/image` remote patterns,
  middleware, or i18n rewrites, which narrows but does not eliminate the
  exposure. Upgrading to `next@16` (a breaking change) is listed in
  `docs/README.md`'s "Next implementation phase."
- `npm audit --omit=dev` at the time of writing reports 0 vulnerabilities
  in production dependencies once `next` is addressed; remaining
  advisories are in devDependencies (build tooling) and do not ship in
  built artifacts.

## What this implementation does not do

- No WAF, rate limiting, or bot detection in front of the API.
- No audit logging separate from the Dignity Ledger (i.e., ledger writes
  are the only durable record of governance decisions -- infrastructure-
  level access logging is left to the deployment environment).
- No automated secret scanning or dependency-update pipeline is configured
  in this repository.
- No independent penetration test or DPIA has been performed.
