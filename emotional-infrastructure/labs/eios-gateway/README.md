# EIOS Gateway (lab prototype)

A minimal routing/service wrapper (`gateway.py`) that fronts a downstream
operation with real CTP + PDEV enforcement. This is a **lab prototype**,
not a production gateway: it has no rate limiting, retry/backoff, circuit
breaking, or observability of its own -- it exists to demonstrate the
"EIOS Gateway integration" requirement with real, runnable logic rather
than a stub.

## Flow

```text
client -> POST /gateway/route -> [1] POST {EI_API}/ctp/validate
                                   |  deny -> 401-equivalent response, not routed
                                   v allow
                               [2] POST {EI_API}/pdev/evaluate
                                   |  not allow -> not routed
                                   v allow
                               [3] "downstream" acknowledgement returned
```

Nothing is routed to the (illustrative) downstream operation unless both
gates return `allow`.

## Run it

```bash
cd labs/eios-gateway
../../apps/api/.venv/bin/pip install -r requirements.txt   # reuses the apps/api virtualenv
EI_API_BASE_URL=http://localhost:8000 ../../apps/api/.venv/bin/uvicorn gateway:app --port 8090
```

## Test it

```bash
cd labs/eios-gateway
../../apps/api/.venv/bin/python -m pytest tests/ -q
```

3 tests: CTP-deny blocks routing, PDEV-deny blocks routing, both-allow
routes and returns a real (not hardcoded-success) downstream
acknowledgement built from the request's own payload.
