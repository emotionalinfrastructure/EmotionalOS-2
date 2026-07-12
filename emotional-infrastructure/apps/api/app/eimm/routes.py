from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.eimm import service
from app.eimm.schemas import AssessRequest, AssessResponse, LevelsResponse

router = APIRouter(prefix="/eimm", tags=["eimm"])


@router.get("/levels", response_model=LevelsResponse)
def levels() -> LevelsResponse:
    return service.get_levels()


@router.post("/assess", response_model=AssessResponse)
def assess(req: AssessRequest, db: Session = Depends(get_db)) -> AssessResponse:
    return service.assess(db, req)
