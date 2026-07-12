"""Runtime configuration for the Emotional Infrastructure governance API.

Loaded from environment variables so the same image can run in Docker
Compose, Helm, or a bare local checkout without code changes.
"""
from __future__ import annotations

import os
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

APP_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="EI_", env_file=".env", extra="ignore")

    environment: str = Field(default="development")

    database_url: str = Field(
        default="postgresql+psycopg://ei:ei@localhost:5432/emotional_infrastructure"
    )

    jwt_issuer: str = Field(default="https://ei-governance-runtime.local")
    jwt_audience: str = Field(default="ei-governance-runtime")
    jwt_algorithm: str = Field(default="ES256")
    token_ttl_seconds: int = Field(default=300)

    key_dir: Path = Field(default=APP_ROOT / "var" / "keys")

    ledger_hmac_secret: str = Field(default="local-dev-ledger-hmac-secret-change-me")

    policy_uri_default: str = Field(
        default="https://ei-governance-runtime.local/policy/v1"
    )
    consent_version: str = Field(default="ctp-0.1")

    cors_origins: str = Field(default="http://localhost:3000")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def max_token_ttl_seconds(self) -> int:
        # CTP §7.4: token lifetime must never exceed 300 seconds regardless
        # of what a caller requests.
        return min(self.token_ttl_seconds, 300)


settings = Settings(
    database_url=os.environ.get(
        "EI_DATABASE_URL",
        os.environ.get("DATABASE_URL", "postgresql+psycopg://ei:ei@localhost:5432/emotional_infrastructure"),
    )
)
