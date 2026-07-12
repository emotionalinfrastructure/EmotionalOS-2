from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.pdev import service
from app.pdev.schemas import PDEVEvaluateRequest, PDEVEvaluateResponse

router = APIRouter(prefix="/pdev", tags=["pdev"])


@router.post("/evaluate", response_model=PDEVEvaluateResponse)
def evaluate(req: PDEVEvaluateRequest, db: Session = Depends(get_db)) -> PDEVEvaluateResponse:
    return service.evaluate(db, req)
