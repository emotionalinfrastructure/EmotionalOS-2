"""Emotional Infrastructure Governance Runtime -- FastAPI application entrypoint.

Candidate governance architecture / reference implementation / developer
prototype. Not certified, not production-validated, not externally audited.
See docs/CLAIM_BOUNDARY.md.
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.claim_boundary.routes import router as claim_boundary_router
from app.config import settings
from app.ctp.routes import router as ctp_router
from app.database import SessionLocal, bootstrap_schema
from app.egl.routes import router as egl_router
from app.eimm.routes import router as eimm_router
from app.ledger.routes import router as ledger_router
from app.pdev.routes import router as pdev_router
from app.policy.routes import router as policy_router
from app.policy.service import seed_default_rules
from app.signals.routes import router as signals_router
from app.tar.routes import router as tar_router
from app.trajectory.routes import router as trajectory_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    bootstrap_schema()
    db = SessionLocal()
    try:
        seed_default_rules(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Emotional Infrastructure Governance Runtime",
    description=(
        "Candidate governance architecture and developer reference implementation "
        "for AI-mediated trust governance (CTP, PDEV, EGL, TAR, Trajectory Governance, "
        "Dignity Ledger). Not certified, not production-validated, not externally audited. "
        "See /docs/CLAIM_BOUNDARY.md in the repository."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ctp_router)
app.include_router(pdev_router)
app.include_router(egl_router)
app.include_router(tar_router)
app.include_router(trajectory_router)
app.include_router(ledger_router)
app.include_router(policy_router)
app.include_router(claim_boundary_router)
app.include_router(signals_router)
app.include_router(eimm_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "emotional-infrastructure-governance-runtime"}


@app.get("/")
def root() -> dict[str, str]:
    return {
        "name": "Emotional Infrastructure Governance Runtime",
        "status": "candidate governance architecture / reference implementation",
        "docs": "/docs",
    }
