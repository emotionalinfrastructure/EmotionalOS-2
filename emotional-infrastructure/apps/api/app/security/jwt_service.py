"""CTP token signing and verification (JWT, ES256).

This wraps PyJWT so the rest of the codebase only deals with plain dict
claims and a small set of typed exceptions, matching the CTP v0.1 rules:
tokens are signed with the runtime's EC key, expire in <=300s, and every
required claim (iss/aud/sub/iat/exp/jti/scope/purpose/context_hash/
policy_uri/consent_level/consent_version) must be present.
"""
from __future__ import annotations

from typing import Any

import jwt as pyjwt

from app.config import settings
from app.security.keys import get_private_key_pem, get_public_key_pem

REQUIRED_CLAIMS = (
    "iss",
    "aud",
    "sub",
    "iat",
    "exp",
    "jti",
    "scope",
    "purpose",
    "context_hash",
    "policy_uri",
    "consent_level",
    "consent_version",
)


class TokenExpiredError(Exception):
    pass


class TokenInvalidError(Exception):
    pass


class TokenMalformedError(Exception):
    pass


def sign_claims(claims: dict[str, Any]) -> str:
    missing = [c for c in REQUIRED_CLAIMS if c not in claims]
    if missing:
        raise TokenMalformedError(f"missing required claims: {missing}")
    return pyjwt.encode(claims, get_private_key_pem(), algorithm=settings.jwt_algorithm)


def decode_and_verify(token: str) -> dict[str, Any]:
    """Verify signature + expiry and return claims.

    Raises TokenExpiredError / TokenInvalidError / TokenMalformedError so
    callers can map to the correct CTP HTTP status codes (401 for all three,
    but with distinct reasons recorded in the ledger).
    """
    try:
        claims = pyjwt.decode(
            token,
            get_public_key_pem(),
            algorithms=[settings.jwt_algorithm],
            audience=settings.jwt_audience,
            options={"require": ["exp", "iat", "jti", "sub"]},
        )
    except pyjwt.ExpiredSignatureError as exc:
        raise TokenExpiredError("token expired") from exc
    except pyjwt.MissingRequiredClaimError as exc:
        raise TokenMalformedError(f"missing claim: {exc}") from exc
    except pyjwt.InvalidTokenError as exc:
        raise TokenInvalidError(str(exc)) from exc

    missing = [c for c in REQUIRED_CLAIMS if c not in claims]
    if missing:
        raise TokenMalformedError(f"missing required claims: {missing}")

    return claims


def decode_unverified(token: str) -> dict[str, Any] | None:
    """Best-effort decode for introspection of malformed/expired tokens.

    Never trusted for authorization decisions; used only to render a
    diagnostic payload on /ctp/introspect.
    """
    try:
        return pyjwt.decode(token, options={"verify_signature": False, "verify_exp": False})
    except Exception:
        return None
