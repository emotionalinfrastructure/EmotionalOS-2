"""
SPEC-101 v1.0.1 §ESC Auditor: replay an export_for_esc_audit() export and
flag inconsistencies. Never touches plaintext - only sha256, the salted
Bloom filter, and the previously computed metrics/route are available.

    1. Hash-chain integrity: each entry's hmac_sha256 must equal
       HMAC(key, canon(entry-without-hmac)), and prev_hash must equal the
       previous entry's hmac (or GENESIS_HASH for the first entry).
    2. Metrics integrity: NAS/delta_a/REI/EVI must be deterministically
       recomputable from the recorded emotion/consent/agency sequence.
       (CIS is excluded - it depends on plaintext the auditor never sees.)
    3. Keyword-triggered routing: re-derive suicidality/trauma presence via
       Bloom membership only, and confirm the recorded route_decided is
       consistent with the non-bypassable router rules.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
from typing import Any, Dict, List

from eios.core.estate import ConsentLevel, EmotionVector, EState, Route, Turn
from eios.core.ledger import GENESIS_HASH, _canon, _load_hmac_key, bloom_test
from eios.core.policy import SUICIDALITY_PHRASES, TRAUMA_KEYWORDS
from eios.metrics.engine import compute_core_metrics

_PAYLOAD_FIELDS = (
    "session_id", "ts", "route_decided", "metrics", "emotion", "consent",
    "agency", "text_sha256", "kw_bloom", "kw_bloom_salt", "bloom_m",
    "bloom_k", "bloom_ngrams", "prev_hash",
)


def full_replay_audit(export: List[Dict[str, Any]], hmac_key: bytes = None) -> List[str]:
    key = _load_hmac_key(hmac_key)
    violations: List[str] = []
    history: List[Turn] = []

    for i, entry in enumerate(export):
        expected_prev = base64.b64encode(GENESIS_HASH).decode() if i == 0 else export[i - 1]["hmac_sha256"]
        if entry["prev_hash"] != expected_prev:
            violations.append(f"CRITICAL: chain break at entry {i}: prev_hash does not reference the prior entry's hmac")

        payload = {field: entry[field] for field in _PAYLOAD_FIELDS}
        recomputed_mac = hmac.new(key, _canon(payload), hashlib.sha256).digest()
        if base64.b64encode(recomputed_mac).decode() != entry["hmac_sha256"]:
            violations.append(f"CRITICAL: hmac mismatch at entry {i}: ledger row contents do not match its recorded hash")

        emotion = EmotionVector(**entry["emotion"])
        route_decided = Route(entry["route_decided"])
        consent = ConsentLevel(entry["consent"])
        synthetic_state = EState(
            session_id=entry["session_id"], route=route_decided, consent=consent, agency=entry["agency"],
        )
        synthetic_state.history = history + [
            Turn(ts=entry["ts"], user_text="", emotion=emotion, route_decided=route_decided)
        ]
        nas, delta_a, rei, evi = compute_core_metrics(synthetic_state)
        stored = entry["metrics"]
        for name, recomputed in (("nas", nas), ("delta_a", delta_a), ("rei", rei), ("evi", evi)):
            if abs(recomputed - stored[name]) > 1e-9:
                violations.append(
                    f"metrics mismatch at entry {i}: {name} recomputed={recomputed!r} stored={stored[name]!r}"
                )
        history = synthetic_state.history

        bloom_bits = base64.b64decode(entry["kw_bloom"])
        salt = base64.b64decode(entry["kw_bloom_salt"])
        m, k = entry["bloom_m"], entry["bloom_k"]
        suicidal_detected = any(bloom_test(bloom_bits, salt, p, m, k) for p in SUICIDALITY_PHRASES)
        trauma_detected = any(bloom_test(bloom_bits, salt, p, m, k) for p in TRAUMA_KEYWORDS)

        if suicidal_detected and route_decided != Route.QUARANTINE:
            violations.append(
                f"CRITICAL: route mismatch at entry {i}: suicidality keyword present (Bloom) but route_decided={route_decided.value}"
            )
        elif (
            not suicidal_detected
            and trauma_detected
            and consent != ConsentLevel.EXPLICIT
            and route_decided not in (Route.CONSENT_GATE, Route.QUARANTINE)
        ):
            violations.append(
                f"CRITICAL: route mismatch at entry {i}: trauma keyword present (Bloom) without explicit "
                f"consent but route_decided={route_decided.value}"
            )

    return violations
