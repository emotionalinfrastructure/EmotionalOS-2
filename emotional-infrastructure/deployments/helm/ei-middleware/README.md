# ei-middleware Helm chart

Candidate governance architecture / reference implementation Helm chart
for the Emotional Infrastructure Governance Runtime. Deploys the API,
the web dashboard, and (optionally, for local/staging use) an in-cluster
PostgreSQL `StatefulSet`.

## Claim boundary

**This chart's Kubernetes deployment has not been executed or tested**
against a real cluster in this reference implementation. Chart syntax
was hand-verified and `docker compose config` / the equivalent Kubernetes
manifests follow conventional Helm patterns, but no `helm install` or
`helm template` dry run has been run here (the `helm` CLI was not
available in the environment this chart was authored in). Validate with
`helm lint` and `helm template --debug` against your own cluster before
relying on this chart. See `docs/VALIDATION_PLAN.md`.

## Usage

```bash
# Local / dev values (default values.yaml)
helm install ei-middleware ./ei-middleware \
  --set api.image.tag=local \
  --set web.image.tag=local

# Staging overlay
helm install ei-middleware ./ei-middleware -f ei-middleware/values-staging.yaml

# Production overlay
helm install ei-middleware ./ei-middleware -f ei-middleware/values-production.yaml
```

Every `REQUIRED_*` placeholder in `values-staging.yaml` and
`values-production.yaml` (image tag, ingress host, CORS origin, secrets,
staging CIDR allowlist) must be replaced before deploying -- the chart
intentionally does not ship working staging/production secrets.

## Structure

- `values.yaml` -- local/dev defaults.
- `values-staging.yaml` -- staging overlay (unresolved placeholders required).
- `values-production.yaml` -- production overlay (unresolved placeholders required, in-chart Postgres disabled).
- `templates/` -- API Deployment/Service, Web Deployment/Service, optional Postgres StatefulSet, Ingress, Secret.
