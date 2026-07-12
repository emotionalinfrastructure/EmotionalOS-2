from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.trajectory import service
from app.trajectory.schemas import TrajectoryEvaluateRequest, TrajectoryEvaluateResponse, TrajectoryEvaluationOut

router = APIRouter(prefix="/trajectory", tags=["trajectory"])


@router.post("/evaluate", response_model=TrajectoryEvaluateResponse)
def evaluate(req: TrajectoryEvaluateRequest, db: Session = Depends(get_db)) -> TrajectoryEvaluateResponse:
    return service.evaluate(db, req)


@router.get("/evaluations", response_model=list[TrajectoryEvaluationOut])
def list_evaluations(limit: int = 100, offset: int = 0, db: Session = Depends(get_db)) -> list[TrajectoryEvaluationOut]:
    rows = service.list_evaluations(db, limit=limit, offset=offset)
    return [TrajectoryEvaluationOut.model_validate(r) for r in rows]


@router.get("/evaluations/{evaluation_id}", response_model=TrajectoryEvaluationOut)
def get_evaluation(evaluation_id: str, db: Session = Depends(get_db)) -> TrajectoryEvaluationOut:
    row = service.get_evaluation(db, evaluation_id)
    if row is None:
        raise HTTPException(status_code=404, detail="trajectory evaluation not found")
    return TrajectoryEvaluationOut.model_validate(row)
