"""Generate an Ed25519 keypair for signing ESC audit exports (eios.tools.export_cli).
Writes the public key to ops/keys/ and prints both the public key and its
SHA-256 fingerprint, base64-encoded. The private key is printed once and
must be stored by the caller - it is never written to disk by this script.
"""

import base64
import hashlib
import pathlib

from nacl.signing import SigningKey

sk = SigningKey.generate()
pk = sk.verify_key

out = pathlib.Path(__file__).parent / "keys"
out.mkdir(parents=True, exist_ok=True)
(out / "eios_v1.0.1_ed25519.pub").write_bytes(pk.encode())

fp = hashlib.sha256(pk.encode()).digest()
print("ED25519 private key (b64, store securely, not written to disk):", base64.b64encode(sk.encode()).decode())
print("ED25519 public key (b64):", base64.b64encode(pk.encode()).decode())
print("Fingerprint (SHA256, b64):", base64.b64encode(fp).decode())
