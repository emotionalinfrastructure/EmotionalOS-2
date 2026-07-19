from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ledger_aggregate_analysis import (  # noqa: E402
    action_distribution,
    decision_distribution,
    deny_rate_by_action,
    summarize,
    unique_subjects,
)

SAMPLE_EVENTS = [
    {"decision": "allow", "pdev_action": "ctp_issue", "signal_category": "tier_0", "sub": "user-1"},
    {"decision": "deny", "pdev_action": "ctp_validate", "signal_category": "tier_0", "sub": "user-1"},
    {"decision": "allow", "pdev_action": "ctp_validate", "signal_category": "tier_2", "sub": "user-2"},
    {"decision": "deny", "pdev_action": "egl_classify_signal", "signal_category": "tier_3", "sub": "user-2"},
]


def test_decision_distribution():
    dist = decision_distribution(SAMPLE_EVENTS)
    assert dist["allow"] == 2
    assert dist["deny"] == 2


def test_action_distribution():
    dist = action_distribution(SAMPLE_EVENTS)
    assert dist["ctp_validate"] == 2


def test_unique_subjects_counts_distinct_only():
    assert unique_subjects(SAMPLE_EVENTS) == 2


def test_deny_rate_by_action():
    rates = deny_rate_by_action(SAMPLE_EVENTS)
    assert rates["ctp_validate"] == 0.5
    assert rates["ctp_issue"] == 0.0
    assert rates["egl_classify_signal"] == 1.0


def test_summarize_shape():
    summary = summarize(SAMPLE_EVENTS)
    assert summary["total_events"] == 4
    assert summary["unique_subjects"] == 2
    assert "decision_distribution" in summary
