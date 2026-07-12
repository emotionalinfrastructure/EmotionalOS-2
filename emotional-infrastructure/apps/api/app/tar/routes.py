from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.tar import service
from app.tar.schemas import (
    AuthorizationOut,
    AuthorizeRequest,
    EvaluateRequest,
    EvaluateResponse,
    ExpireRequest,
    ExpireResponse,
)

router = APIRouter(prefix="/tar", tags=["tar"])


@router.post("/authorize", response_model=AuthorizationOut, status_code=201)
def authorize(req: AuthorizeRequest, db: Session = Depends(get_db)) -> AuthorizationOut:
    return service.authorize(db, req)


@router.post("/evaluate", response_model=EvaluateResponse)
def evaluate(req: EvaluateRequest, db: Session = Depends(get_db)) -> EvaluateResponse:
    return service.evaluate(db, req)


@router.post("/expire", response_model=ExpireResponse)
def expire(req: ExpireRequest, db: Session = Depends(get_db)) -> ExpireResponse:
    return service.expire(db, req)


@router.get("/authorizations/{authorization_id}", response_model=AuthorizationOut)
def get_authorization(authorization_id: str, db: Session = Depends(get_db)) -> AuthorizationOut:
    row = service.get_authorization(db, authorization_id)
    if row is None:
        raise HTTPException(status_code=404, detail="authorization not found")
    return AuthorizationOut.model_validate(row)
