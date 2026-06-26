"""
SPEC-101 v1.0.1 §Ledger: SQLite (WAL), hash-chained, PII-scrubbed
interaction ledger with a salted unigram+bigram keyword Bloom filter
per turn so the ESC Auditor can re-derive keyword-triggered routes
without ever reading plaintext (§ESC Auditor).

Canonical JSON via orjson (sorted keys) feeds an HMAC-SHA256 hash
chain: each row's hmac covers its own fields plus the previous row's
hmac, so any edit or reorder breaks the chain from that point on.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import os
import sqlite3
from dataclasses import asdict
from typing import Any, Dict, List, Optional

import orjson

from eios.core.estate import ConsentLevel, EmotionVector, Metrics, Route
from eios.core.policy import ngrams

BLOOM_M = 512  # bits
BLOOM_K = 4  # hash rounds
GENESIS_HASH = b"\x00" * 32

_HMAC_KEY_ENV = "EIOS_HMAC_KEY"


def _load_hmac_key(explicit: Optional[bytes]) -> bytes:
    if explicit is not None:
        return explicit
    b64_key = os.environ.get(_HMAC_KEY_ENV)
    if not b64_key:
        raise ValueError(
            f"{_HMAC_KEY_ENV} is not set. The ledger's hash chain is only "
            "verifiable if every writer and the ESC Auditor share the same "
            "HMAC key; refusing to invent one."
        )
    return base64.b64decode(b64_key)


def _canon(obj: Dict[str, Any]) -> bytes:
    return orjson.dumps(obj, option=orjson.OPT_SORT_KEYS)


def _bloom_indices(salt: bytes, token: str, m: int, k: int) -> List[int]:
    indices = []
    for i in range(k):
        digest = hashlib.sha256(salt + i.to_bytes(1, "big") + token.encode("utf-8")).digest()
        indices.append(int.from_bytes(digest[:8], "big") % m)
    return indices


def _bloom_build(text: str, salt: bytes, m: int = BLOOM_M, k: int = BLOOM_K) -> (bytes, int):
    grams = ngrams(text)
    bits = bytearray((m + 7) // 8)
    for token in grams:
        for idx in _bloom_indices(salt, token, m, k):
            bits[idx // 8] |= 1 << (idx % 8)
    return bytes(bits), len(grams)


def bloom_test(bits: bytes, salt: bytes, token: str, m: int, k: int) -> bool:
    """True iff `token` (a single unigram/bigram) may be present per the Bloom
    filter. False positives are possible by construction; false negatives are not."""
    for idx in _bloom_indices(salt, token, m, k):
        if not (bits[idx // 8] & (1 << (idx % 8))):
            return False
    return True


class Ledger:
    def __init__(self, db_path: str = ":memory:", hmac_key: Optional[bytes] = None):
        self._hmac_key = _load_hmac_key(hmac_key)
        self._conn = sqlite3.connect(db_path, check_same_thread=False)
        self._conn.execute("PRAGMA journal_mode=WAL")
        self._init_schema()

    def _init_schema(self) -> None:
        self._conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS audit_ledger (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                ts TEXT NOT NULL,
                route_decided TEXT NOT NULL,
                metrics_json BLOB NOT NULL,
                emotion_json BLOB NOT NULL,
                consent TEXT NOT NULL,
                agency REAL NOT NULL,
                text_sha256 BLOB NOT NULL,
                kw_bloom BLOB NOT NULL,
                kw_bloom_salt BLOB NOT NULL,
                bloom_m INTEGER NOT NULL,
                bloom_k INTEGER NOT NULL,
                bloom_ngrams INTEGER NOT NULL,
                prev_hash BLOB NOT NULL,
                hmac_sha256 BLOB NOT NULL
            );
            """
        )
        self._conn.commit()

    def _ensure_session(self, session_id: str, ts: str) -> None:
        self._conn.execute(
            "INSERT OR IGNORE INTO sessions (session_id, created_at) VALUES (?, ?)",
            (session_id, ts),
        )

    def _last_hmac(self, session_id: str) -> bytes:
        row = self._conn.execute(
            "SELECT hmac_sha256 FROM audit_ledger WHERE session_id = ? ORDER BY id DESC LIMIT 1",
            (session_id,),
        ).fetchone()
        return row[0] if row else GENESIS_HASH

    def append(
        self,
        session_id: str,
        ts: str,
        route_decided: Route,
        metrics: Metrics,
        emotion: EmotionVector,
        text_raw: str,
        consent: ConsentLevel,
        agency: float,
    ) -> Dict[str, Any]:
        self._ensure_session(session_id, ts)

        text_hash = hashlib.sha256(text_raw.lower().encode("utf-8")).digest()
        salt = os.urandom(16)
        kw_bloom, ngram_count = _bloom_build(text_raw, salt)
        prev_hash = self._last_hmac(session_id)

        metrics_dict = metrics.as_dict()
        emotion_dict = asdict(emotion)

        payload = {
            "session_id": session_id,
            "ts": ts,
            "route_decided": route_decided.value,
            "metrics": metrics_dict,
            "emotion": emotion_dict,
            "consent": consent.value,
            "agency": agency,
            "text_sha256": base64.b64encode(text_hash).decode(),
            "kw_bloom": base64.b64encode(kw_bloom).decode(),
            "kw_bloom_salt": base64.b64encode(salt).decode(),
            "bloom_m": BLOOM_M,
            "bloom_k": BLOOM_K,
            "bloom_ngrams": ngram_count,
            "prev_hash": base64.b64encode(prev_hash).decode(),
        }
        mac = hmac.new(self._hmac_key, _canon(payload), hashlib.sha256).digest()

        self._conn.execute(
            """
            INSERT INTO audit_ledger (
                session_id, ts, route_decided, metrics_json, emotion_json,
                consent, agency, text_sha256, kw_bloom, kw_bloom_salt,
                bloom_m, bloom_k, bloom_ngrams, prev_hash, hmac_sha256
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session_id, ts, route_decided.value,
                orjson.dumps(metrics_dict), orjson.dumps(emotion_dict),
                consent.value, agency, text_hash, kw_bloom, salt,
                BLOOM_M, BLOOM_K, ngram_count, prev_hash, mac,
            ),
        )
        self._conn.commit()

        entry = dict(payload)
        entry["hmac_sha256"] = base64.b64encode(mac).decode()
        return entry

    def export_for_esc_audit(self, session_id: str) -> List[Dict[str, Any]]:
        rows = self._conn.execute(
            """
            SELECT ts, route_decided, metrics_json, emotion_json, consent, agency,
                   text_sha256, kw_bloom, kw_bloom_salt, bloom_m, bloom_k,
                   bloom_ngrams, prev_hash, hmac_sha256
            FROM audit_ledger WHERE session_id = ? ORDER BY id ASC
            """,
            (session_id,),
        ).fetchall()

        export = []
        for (ts, route_decided, metrics_json, emotion_json, consent, agency,
             text_sha256, kw_bloom, kw_bloom_salt, bloom_m, bloom_k,
             bloom_ngrams, prev_hash, mac) in rows:
            export.append({
                "session_id": session_id,
                "ts": ts,
                "route_decided": route_decided,
                "metrics": orjson.loads(metrics_json),
                "emotion": orjson.loads(emotion_json),
                "consent": consent,
                "agency": agency,
                "text_sha256": base64.b64encode(text_sha256).decode(),
                "kw_bloom": base64.b64encode(kw_bloom).decode(),
                "kw_bloom_salt": base64.b64encode(kw_bloom_salt).decode(),
                "bloom_m": bloom_m,
                "bloom_k": bloom_k,
                "bloom_ngrams": bloom_ngrams,
                "prev_hash": base64.b64encode(prev_hash).decode(),
                "hmac_sha256": base64.b64encode(mac).decode(),
            })
        return export

    def to_dicts(self) -> List[Dict[str, Any]]:
        rows = self._conn.execute(
            "SELECT DISTINCT session_id FROM audit_ledger"
        ).fetchall()
        out: List[Dict[str, Any]] = []
        for (session_id,) in rows:
            out.extend(self.export_for_esc_audit(session_id))
        return out

    def close(self) -> None:
        self._conn.close()
