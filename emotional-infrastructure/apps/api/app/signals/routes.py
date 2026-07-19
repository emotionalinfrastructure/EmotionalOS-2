from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.signals import service
from app.signals.schemas import SignalEvaluateRequest, SignalEvaluateResponse, TaxonomyResponse

router = APIRouter(prefix="/signals", tags=["signals"])


@router.get("/taxonomy", response_model=TaxonomyResponse)
def taxonomy() -> TaxonomyResponse:
    return service.get_taxonomy()


@router.post("/evaluate", response_model=SignalEvaluateResponse)
def evaluate(req: SignalEvaluateRequest, db: Session = Depends(get_db)) -> SignalEvaluateResponse:
    return service.evaluate_signal(db, req)
