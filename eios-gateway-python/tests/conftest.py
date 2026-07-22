import base64
import os
import sys
from pathlib import Path

# Make eios-sdk-python importable from the source tree without a pip editable install.
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "eios-sdk-python"))

# Must be set before any test module imports app.main (which creates a
# module-level EIOSGateway -> EIOSEngine -> Ledger that reads EIOS_HMAC_KEY).
os.environ.setdefault(
    "EIOS_HMAC_KEY",
    base64.b64encode(b"test_key_test_key_test_key_1234").decode(),
)
