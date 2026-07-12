from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.egl import service
from app.egl.schemas import (
    CircuitBreakerRequest,
    CircuitBreakerResponse,
    ClassifySignalRequest,
    ClassifySignalResponse,
    ConsentStepUpRequest,
    ConsentStepUpResponse,
)

router = APIRouter(prefix="/egl", tags=["egl"])


@router.post("/classify-signal", response_model=ClassifySignalResponse)
def classify_signal(req: ClassifySignalRequest, db: Session = Depends(get_db)) -> ClassifySignalResponse:
    return service.classify_signal(db, req)


@router.post("/evaluate-circuit-breaker", response_model=CircuitBreakerResponse)
def evaluate_circuit_breaker(req: CircuitBreakerRequest, db: Session = Depends(get_db)) -> CircuitBreakerResponse:
    return service.evaluate_circuit_breaker(db, req)


@router.post("/consent-step-up", response_model=ConsentStepUpResponse)
def consent_step_up(req: ConsentStepUpRequest, db: Session = Depends(get_db)) -> ConsentStepUpResponse:
    return service.consent_step_up(db, req)
