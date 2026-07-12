"""Restricted public-claim language and claim-disciplined replacements.

Mirrors docs/CLAIM_BOUNDARY.md exactly -- this module is the single source
of truth both the scanner and the documentation should agree with.
"""
from __future__ import annotations

RESTRICTED_PHRASE_REPLACEMENTS: dict[str, str] = {
    "certified": "reference implementation",
    "regulator-approved": "candidate architecture (not yet regulator-reviewed)",
    "legally compliant": "designed to align with (not a legal-compliance claim)",
    "clinically validated": "developer prototype (not clinically validated)",
    "externally audited": "not yet externally audited",
    "production-ready": "developer prototype",
    "benchmark-proven": "validation-ready (no benchmark claims made)",
    "standards-body adopted": "proposed technical framework",
    "guaranteed compliant": "validation-ready (compliance not guaranteed)",
    "proven compliance": "candidate architecture (compliance not proven)",
}

RESTRICTED_PHRASES: list[str] = list(RESTRICTED_PHRASE_REPLACEMENTS.keys())

SAFE_REPLACEMENTS: list[str] = [
    "candidate architecture",
    "proposed framework",
    "reference implementation",
    "validation-ready",
    "designed to align with",
    "pilot implementation",
    "developer prototype",
    "governance runtime",
    "not yet externally audited",
]
