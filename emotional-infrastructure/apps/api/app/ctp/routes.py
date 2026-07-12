from __future__ import annotations

from fastapi.encoders import jsonable_encoder
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.ctp import service
from app.ctp.schemas import (
    CRLEntry,
    IntrospectRequest,
    IntrospectResponse,
    IssueRequest,
    IssueResponse,
    ProcessRequest,
    RevokeRequest,
    ValidateRequest,
)
from app.database import get_db

router = APIRouter(prefix="/ctp", tags=["ctp"])


@router.post("/issue", response_model=IssueResponse, status_code=201)
def issue_token(req: IssueRequest, db: Session = Depends(get_db)) -> IssueResponse:
    return service.issue(db, req)


@router.post("/validate")
def validate_token(req: ValidateRequest, db: Session = Depends(get_db)) -> JSONResponse:
    status_code, response = service.validate(db, req)
    return JSONResponse(status_code=status_code, content=jsonable_encoder(response))


@router.post("/revoke")
def revoke_token(req: RevokeRequest, db: Session = Depends(get_db)) -> JSONResponse:
    status_code, response = service.revoke(db, req.jti, req.reason)
    return JSONResponse(status_code=status_code, content=jsonable_encoder(response))


@router.post("/introspect", response_model=IntrospectResponse)
def introspect_token(req: IntrospectRequest, db: Session = Depends(get_db)) -> IntrospectResponse:
    return service.introspect(db, req.token)


@router.get("/crl", response_model=list[CRLEntry])
def get_crl(db: Session = Depends(get_db)) -> list[CRLEntry]:
    return service.crl(db)


@router.post("/process")
def process_request(req: ProcessRequest, db: Session = Depends(get_db)) -> JSONResponse:
    status_code, response = service.process(db, req)
    return JSONResponse(status_code=status_code, content=jsonable_encoder(response))
