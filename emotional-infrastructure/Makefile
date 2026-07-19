.PHONY: api-install api-dev api-test web-install web-dev web-build web-test \
        packages-build packages-test sdk-build sdk-test docker-up docker-down \
        test-all

api-install:
	cd apps/api && python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt

api-dev:
	cd apps/api && . .venv/bin/activate && uvicorn app.main:app --reload --port 8000

api-test:
	cd apps/api && . .venv/bin/activate && python -m pytest -q

web-install:
	npm install

web-dev:
	npm run dev:web

web-build:
	npm run build:web

web-test:
	npm run test --workspace=apps/web

packages-build:
	npm run build:packages

packages-test:
	npm run test:packages

sdk-build:
	npm run build --workspace=packages/eis-sdk

sdk-test:
	npm run verify --workspace=packages/eis-sdk

docker-up:
	cd deployments/docker && docker compose up --build

docker-down:
	cd deployments/docker && docker compose down -v

test-all: api-test packages-test web-test
