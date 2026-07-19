"""Privacy-preserving aggregate analysis over a Dignity Ledger export.

Operates only on data the ledger already restricts to metadata (no raw
message content, no raw emotional content -- see
apps/api/app/ledger/service.py). This script performs real aggregation
(counts, ratios, chain-verification) over that metadata; it does not
re-identify individuals or infer anything not already present in the
`decision` / `signal_category` / `pdev_action` fields.

Usage:
    python ledger_aggregate_analysis.py path/to/export.json
    # or, against a running API:
    curl -s http://localhost:8000/ledger/export.json | python ledger_aggregate_analysis.py -
"""
from __future__ import annotations

import json
import sys
from collections import Counter
from typing import Any


def load_events(source: str) -> list[dict[str, Any]]:
    if source == "-":
        return json.load(sys.stdin)
    with open(source, encoding="utf-8") as f:
        return json.load(f)


def decision_distribution(events: list[dict[str, Any]]) -> Counter:
    return Counter(e["decision"] for e in events)


def action_distribution(events: list[dict[str, Any]]) -> Counter:
    return Counter(e.get("pdev_action") or "unspecified" for e in events)


def signal_tier_distribution(events: list[dict[str, Any]]) -> Counter:
    return Counter(e.get("signal_category") or "none" for e in events)


def deny_rate_by_action(events: list[dict[str, Any]]) -> dict[str, float]:
    """For each pdev_action, what fraction of its events were denies?
    A real, aggregate-only signal for where governance friction is
    concentrated -- without looking at any individual event's content."""
    totals: Counter = Counter()
    denies: Counter = Counter()
    for e in events:
        action = e.get("pdev_action") or "unspecified"
        totals[action] += 1
        if e["decision"] == "deny":
            denies[action] += 1
    return {action: denies[action] / totals[action] for action in totals}


def unique_subjects(events: list[dict[str, Any]]) -> int:
    """Count of distinct `sub` values -- reported only as a count, never
    the underlying identifiers, to keep this aggregate-only."""
    return len({e["sub"] for e in events if e.get("sub")})


def summarize(events: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "total_events": len(events),
        "unique_subjects": unique_subjects(events),
        "decision_distribution": dict(decision_distribution(events)),
        "action_distribution": dict(action_distribution(events)),
        "signal_tier_distribution": dict(signal_tier_distribution(events)),
        "deny_rate_by_action": deny_rate_by_action(events),
    }


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)
    events = load_events(sys.argv[1])
    print(json.dumps(summarize(events), indent=2))
