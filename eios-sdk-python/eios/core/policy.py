"""
Policy Bundle (SPEC-101 §Method/Architecture): keyword lists, recovery
windows, and weights consumed by the Router, Metrics Engine, and ESC
Auditor. "Should have" per SPEC-101: configurable keyword lists -
this module is the seam to swap in a signed policy bundle later.

Keyword phrases are restricted to unigrams/bigrams so that ledger
n-gram Bloom membership (see core/ledger.py) can re-derive their
presence without ever storing plaintext.
"""

from __future__ import annotations

import re
from typing import FrozenSet, Tuple

# CIS keyword set is fixed by SPEC-101 §Must-have (formula literal).
TRAUMA_KEYWORDS: FrozenSet[str] = frozenset({"rape", "abused", "molested", "trauma"})

# Illustrative suicidality phrase list; replace via a signed policy
# bundle for production certification.
SUICIDALITY_PHRASES: FrozenSet[str] = frozenset({
    "suicide", "suicidal", "overdose",
    "kill myself", "end it", "pills ready", "hang myself", "no reason",
})

# Recovery windows. SAFE_MODE(3)->CONTAINMENT and CONTAINMENT(4)->NORMAL
# are literal SPEC-101 §Must-have values. SPEC-101's state diagram also
# shows QUARANTINE -> CONTAINMENT "stabilized x N" with N left
# unspecified, and no transition into SAFE_MODE at all. We resolve this
# by routing recovery through QUARANTINE -> SAFE_MODE -> CONTAINMENT ->
# NORMAL, reusing the SAFE_MODE cadence (3 stabilized turns) for the
# QUARANTINE leg so every route has a documented, deterministic
# recovery path.
QUARANTINE_TO_SAFE_MODE_TURNS = 3
SAFE_MODE_TO_CONTAINMENT_TURNS = 3
CONTAINMENT_TO_NORMAL_TURNS = 4

HELPLINE_TEXT = "If you are in crisis, call or text 988, or visit findahelpline.com."

_WORD_RE = re.compile(r"[a-z0-9']+")


def tokenize(text: str) -> Tuple[str, ...]:
    """Lowercase word tokens, punctuation stripped. Deterministic and
    shared by the router (plaintext) and ledger (Bloom build) so both
    sides agree on what an n-gram is."""
    return tuple(_WORD_RE.findall(text.lower()))


def bigrams(tokens: Tuple[str, ...]) -> Tuple[str, ...]:
    return tuple(f"{a} {b}" for a, b in zip(tokens, tokens[1:]))


def ngrams(text: str) -> FrozenSet[str]:
    tokens = tokenize(text)
    return frozenset(tokens) | frozenset(bigrams(tokens))


def phrase_present(text: str, phrases: FrozenSet[str]) -> bool:
    found = ngrams(text)
    return any(phrase in found for phrase in phrases)


def detect_suicidality(text: str) -> bool:
    return phrase_present(text, SUICIDALITY_PHRASES)


def detect_trauma(text: str) -> bool:
    return phrase_present(text, TRAUMA_KEYWORDS)
