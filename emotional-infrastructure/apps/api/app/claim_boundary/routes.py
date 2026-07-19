from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.claim_boundary import service
from app.claim_boundary.schemas import ClaimRulesResponse, ClaimScanRequest, ClaimScanResponse
from app.database import get_db

router = APIRouter(prefix="/claim-boundary", tags=["claim-boundary"])


@router.post("/scan", response_model=ClaimScanResponse)
def scan(req: ClaimScanRequest, db: Session = Depends(get_db)) -> ClaimScanResponse:
    return service.scan(db, req)


@router.get("/rules", response_model=ClaimRulesResponse)
def rules() -> ClaimRulesResponse:
    return service.get_rules()
