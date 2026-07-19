"""EC (P-256) key management for CTP token signing (JWT alg ES256).

On first startup a key pair is generated and persisted under
``settings.key_dir``. Subsequent startups reuse the same key pair so that
previously issued tokens (and their signatures) remain verifiable for their
short (<=300s) lifetime, and so ``/ctp/introspect`` and ``/ctp/validate``
behave consistently across process restarts within a single deployment.
"""
from __future__ import annotations

from pathlib import Path

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec

from app.config import settings

_PRIVATE_KEY_FILE = "ec_private_key.pem"
_PUBLIC_KEY_FILE = "ec_public_key.pem"


def _generate_key_pair(key_dir: Path) -> tuple[bytes, bytes]:
    key_dir.mkdir(parents=True, exist_ok=True)
    private_key = ec.generate_private_key(ec.SECP256R1())
    private_bytes = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    public_bytes = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    (key_dir / _PRIVATE_KEY_FILE).write_bytes(private_bytes)
    (key_dir / _PUBLIC_KEY_FILE).write_bytes(public_bytes)
    return private_bytes, public_bytes


def load_or_create_keys(key_dir: Path | None = None) -> tuple[str, str]:
    key_dir = key_dir or settings.key_dir
    private_path = key_dir / _PRIVATE_KEY_FILE
    public_path = key_dir / _PUBLIC_KEY_FILE

    if private_path.exists() and public_path.exists():
        return private_path.read_text(), public_path.read_text()

    private_bytes, public_bytes = _generate_key_pair(key_dir)
    return private_bytes.decode("utf-8"), public_bytes.decode("utf-8")


_private_pem: str | None = None
_public_pem: str | None = None


def get_private_key_pem() -> str:
    global _private_pem, _public_pem
    if _private_pem is None:
        _private_pem, _public_pem = load_or_create_keys()
    return _private_pem


def get_public_key_pem() -> str:
    global _private_pem, _public_pem
    if _public_pem is None:
        _private_pem, _public_pem = load_or_create_keys()
    return _public_pem
