#!/usr/bin/env bash
set -euo pipefail

echo "Waiting for database..."
python - <<'PYEOF'
import time
import sys
from sqlalchemy import create_engine, text
from app.config import settings

for attempt in range(30):
    try:
        engine = create_engine(settings.database_url)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("Database is reachable.")
        sys.exit(0)
    except Exception as exc:  # noqa: BLE001
        print(f"Database not ready (attempt {attempt + 1}/30): {exc}")
        time.sleep(2)
print("Database did not become reachable in time.")
sys.exit(1)
PYEOF

echo "Running Alembic migrations..."
alembic upgrade head

echo "Starting API server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
