"""
SPEC-101 v1.0.1 §Tooling / export_cli_signing patch: sign a session's
ESC audit export with Ed25519 (PyNaCl) so the ESC can verify provenance
without trusting the transport. The signed bundle embeds the public key
and its SHA-256 fingerprint alongside the signature, per the patch intent
(the pre-patch version omitted both, leaving signature verification
without a published key to check against).
"""

from __future__ import annotations

import argparse
import base64
import hashlib
from typing import Any, Dict, Optional

import orjson
from nacl.exceptions import BadSignatureError
from nacl.signing import SigningKey, VerifyKey

from eios.core.ledger import Ledger


def load_signing_key(key_path: str) -> SigningKey:
    raw = open(key_path, "rb").read()
    if len(raw) != 32:
        try:
            raw = base64.b64decode(raw.strip(), validate=True)
        except Exception as exc:
            raise ValueError(f"Ed25519 signing key at {key_path} is not 32 raw bytes or valid base64") from exc
    if len(raw) != 32:
        raise ValueError(f"Ed25519 signing key at {key_path} must decode to exactly 32 bytes")
    return SigningKey(raw)


def sign_export(session_id: str, db_path: str, signing_key: SigningKey) -> Dict[str, Any]:
    ledger = Ledger(db_path=db_path)
    export = ledger.export_for_esc_audit(session_id)
    payload = orjson.dumps(export, option=orjson.OPT_SORT_KEYS)

    sig = signing_key.sign(payload).signature
    pub = signing_key.verify_key.encode()
    pub_fp = hashlib.sha256(pub).digest()

    return {
        "payload": payload.decode(),
        "sig_ed25519": base64.b64encode(sig).decode(),
        "pubkey_b64": base64.b64encode(pub).decode(),
        "pubkey_fingerprint_sha256_b64": base64.b64encode(pub_fp).decode(),
    }


def verify_export(signed: Dict[str, Any]) -> bool:
    """Round-trip verification: the fingerprint matches the embedded
    pubkey, and the signature verifies against the embedded payload."""
    pub = base64.b64decode(signed["pubkey_b64"])
    fp = hashlib.sha256(pub).digest()
    if base64.b64encode(fp).decode() != signed["pubkey_fingerprint_sha256_b64"]:
        return False
    try:
        VerifyKey(pub).verify(signed["payload"].encode(), base64.b64decode(signed["sig_ed25519"]))
        return True
    except BadSignatureError:
        return False


def main(argv: Optional[list] = None) -> None:
    parser = argparse.ArgumentParser(description="Sign an EIOS session ledger export for ESC submission.")
    parser.add_argument("--session-id", required=True)
    parser.add_argument("--db", default=":memory:", help="Path to the SQLite ledger database")
    parser.add_argument("--key", required=True, help="Path to an Ed25519 signing key (32 raw bytes, or its base64)")
    args = parser.parse_args(argv)

    signing_key = load_signing_key(args.key)
    result = sign_export(args.session_id, args.db, signing_key)
    print(orjson.dumps(result).decode())


if __name__ == "__main__":  # pragma: no cover
    main()
