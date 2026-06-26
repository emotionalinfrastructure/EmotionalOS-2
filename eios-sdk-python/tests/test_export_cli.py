import base64

import pytest
from nacl.signing import SigningKey

from eios.core.engine import EIOSEngine
from eios.tools.export_cli import load_signing_key, main, sign_export, verify_export


def _dummy_responder(text, state, route):
    return "ok"


@pytest.fixture
def session_db(tmp_path):
    db_path = str(tmp_path / "ledger.db")
    engine = EIOSEngine(system_id="test-system", responder=_dummy_responder, ledger_path=db_path)
    engine.process_interaction("s1", "just checking in today")
    engine.ledger.close()
    return db_path


@pytest.fixture
def signing_key_path(tmp_path):
    key = SigningKey.generate()
    key_path = tmp_path / "signing.key"
    key_path.write_bytes(bytes(key))
    return str(key_path)


def test_load_signing_key_from_raw_bytes(signing_key_path):
    key = load_signing_key(signing_key_path)

    assert len(bytes(key)) == 32


def test_load_signing_key_from_base64(tmp_path):
    key = SigningKey.generate()
    key_path = tmp_path / "signing_b64.key"
    key_path.write_bytes(base64.b64encode(bytes(key)))

    loaded = load_signing_key(str(key_path))

    assert bytes(loaded) == bytes(key)


def test_sign_export_round_trips_through_verify(session_db, signing_key_path):
    signing_key = load_signing_key(signing_key_path)

    signed = sign_export("s1", session_db, signing_key)

    assert verify_export(signed)
    assert signed["pubkey_fingerprint_sha256_b64"]


def test_verify_export_rejects_tampered_payload(session_db, signing_key_path):
    signing_key = load_signing_key(signing_key_path)
    signed = sign_export("s1", session_db, signing_key)

    signed["payload"] = signed["payload"].replace("NORMAL", "QUARANTINE")

    assert not verify_export(signed)


def test_verify_export_rejects_mismatched_pubkey_fingerprint(session_db, signing_key_path):
    signing_key = load_signing_key(signing_key_path)
    signed = sign_export("s1", session_db, signing_key)

    other_pub = SigningKey.generate().verify_key.encode()
    signed["pubkey_b64"] = base64.b64encode(other_pub).decode()

    assert not verify_export(signed)


def test_load_signing_key_rejects_invalid_base64(tmp_path):
    bad_key_path = tmp_path / "bad.key"
    bad_key_path.write_bytes(b"not valid base64 content!!")

    with pytest.raises(ValueError):
        load_signing_key(str(bad_key_path))


def test_load_signing_key_rejects_wrong_length_after_decode(tmp_path):
    short_key_path = tmp_path / "short.key"
    short_key_path.write_bytes(base64.b64encode(b"too short"))

    with pytest.raises(ValueError):
        load_signing_key(str(short_key_path))


def test_main_signs_and_prints_export(session_db, signing_key_path, capsys):
    main(["--session-id", "s1", "--db", session_db, "--key", signing_key_path])

    captured = capsys.readouterr()
    assert "sig_ed25519" in captured.out
