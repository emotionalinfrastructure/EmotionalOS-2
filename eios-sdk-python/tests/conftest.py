import base64
import os

import pytest


@pytest.fixture(autouse=True)
def eios_hmac_key():
    os.environ["EIOS_HMAC_KEY"] = base64.b64encode(b"test_key_test_key_test_key_1234").decode()
    yield
