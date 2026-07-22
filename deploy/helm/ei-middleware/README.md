# ei-middleware Helm Chart

## Install
```bash
helm upgrade --install ei ./ei-middleware \
  --set image.repository=yourrepo/ei-middleware \
  --set image.tag=latest \
  --set secretEnv.LLM_API_KEY=$LLM_API_KEY \
  --set secretEnv.API_KEY=$API_KEY
```

## Optional: enable Prometheus scraping
```bash
helm upgrade --install ei ./ei-middleware \
  --set podAnnotations."prometheus\.io/scrape"="true" \
  --set podAnnotations."prometheus\.io/port"="8080" \
  --set podAnnotations."prometheus\.io/path"="/metrics"
```

## JWT auth
```bash
helm upgrade --install ei ./ei-middleware \
  --set env.AUTH_MODE=both \
  --set-file secretEnv.JWT_PUBLIC_KEY=./jwtRS256.pub
```

## Ingress
```bash
helm upgrade --install ei ./ei-middleware \
  --set ingress.enabled=true \
  --set ingress.className=nginx \
  --set ingress.hosts[0].host=ei.example.com \
  --set ingress.hosts[0].paths[0].path=/ \
  --set ingress.hosts[0].paths[0].pathType=Prefix
```

## Values
See `values.yaml` for all available knobs (replicas, resources, HPA, PDB, env, secrets).


## TLS with cert-manager
Example (Cloudflare/Let’s Encrypt):
```bash
helm upgrade --install ei ./ei-middleware   --set ingress.enabled=true   --set ingress.className=nginx   --set ingress.annotations."cert-manager\.io/cluster-issuer"=letsencrypt-prod   --set ingress.hosts[0].host=ei.example.com   --set ingress.hosts[0].paths[0].path=/   --set ingress.hosts[0].paths[0].pathType=Prefix   --set ingress.tls[0].hosts[0]=ei.example.com   --set ingress.tls[0].secretName=ei-tls
```

## Toggle UI inspector
The service always serves `/ui`. To hide it from users or turn off the feature:
```bash
helm upgrade --install ei ./ei-middleware --set ui.enabled=false
```
This sets `UI_ENABLED=false` in the pod, which your app can read to disable or guard access.
