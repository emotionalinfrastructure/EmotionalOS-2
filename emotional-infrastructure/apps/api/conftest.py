"""Root pytest fixtures for the Emotional Infrastructure API test suite.

Uses a dedicated Postgres database (EI_TEST_DATABASE_URL, default
``ei_test``) so tests never touch local development data. Every test gets
a freshly bootstrapped schema (and seeded default policy rules) so the
Dignity Ledger hash chain and PDEV/CTP state are deterministic per test.

Placed at the project root (not app/tests/) so its fixtures are visible to
every test module, including app/ctp/tests.py alongside app/tests/*.py.
"""
from __future__ import annotations

import os

os.environ["EI_DATABASE_URL"] = os.environ.get(
    "EI_TEST_DATABASE_URL", "postgresql+psycopg://ei:ei@localhost:5432/ei_test"
)

import pytest
from fastapi.testclient import TestClient

from app.database import Base, SessionLocal, engine
from app.main import app
from app.policy.service import seed_default_rules


@pytest.fixture(autouse=True)
def _reset_db():
    import app.models  # noqa: F401

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_default_rules(db)
    finally:
        db.close()
    yield


@pytest.fixture()
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture()
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
