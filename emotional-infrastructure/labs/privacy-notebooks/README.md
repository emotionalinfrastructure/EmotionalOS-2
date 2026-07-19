# Privacy Notebooks

Real, runnable aggregate-analysis scripts over Dignity Ledger exports.
The ledger already restricts what it stores to decision metadata (no raw
message content, no raw emotional content -- see
`apps/api/app/ledger/service.py`); everything here stays within that
boundary and adds no re-identification risk.

## `ledger_aggregate_analysis.py`

Computes decision distribution, per-action deny rate, signal-tier
distribution, and a distinct-subject count (reported only as a count,
never the identifiers themselves) from a ledger export.

```bash
# From a live API:
curl -s http://localhost:8000/ledger/export.json | \
  ../../apps/api/.venv/bin/python ledger_aggregate_analysis.py -

# From a saved export:
../../apps/api/.venv/bin/python ledger_aggregate_analysis.py export.json
```

## Tests

```bash
../../apps/api/.venv/bin/python -m pytest tests/ -q
```
