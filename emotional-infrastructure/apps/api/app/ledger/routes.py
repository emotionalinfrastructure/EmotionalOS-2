from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.ledger import service
from app.ledger.schemas import LedgerEventCreate, LedgerEventOut, LedgerVerifyResult

router = APIRouter(prefix="/ledger", tags=["ledger"])


@router.post("/events", response_model=LedgerEventOut, status_code=201)
def create_event(payload: LedgerEventCreate, db: Session = Depends(get_db)) -> LedgerEventOut:
    row = service.append_event(
        db,
        decision=payload.decision,
        policy_version=payload.policy_version,
        ctid_reference=payload.ctid_reference,
        jti=payload.jti,
        sub=payload.sub,
        signal_category=payload.signal_category,
        inference_label=payload.inference_label,
        pdev_action=payload.pdev_action,
        context_hash=payload.context_hash,
        event_metadata=payload.event_metadata,
    )
    return LedgerEventOut.model_validate(row)


@router.get("/events", response_model=list[LedgerEventOut])
def get_events(
    sub: str | None = None,
    jti: str | None = None,
    decision: str | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
) -> list[LedgerEventOut]:
    rows = service.list_events(db, sub=sub, jti=jti, decision=decision, limit=limit, offset=offset)
    return [LedgerEventOut.model_validate(r) for r in rows]


@router.get("/verify", response_model=LedgerVerifyResult)
def verify(db: Session = Depends(get_db)) -> LedgerVerifyResult:
    return LedgerVerifyResult(**service.verify_chain(db))


@router.get("/export.json")
def export_json(db: Session = Depends(get_db)) -> Response:
    return Response(content=service.export_json(db), media_type="application/json")


@router.get("/export.csv")
def export_csv(db: Session = Depends(get_db)) -> Response:
    return Response(content=service.export_csv(db), media_type="text/csv")


@router.get("/events/{event_id}", response_model=LedgerEventOut)
def get_event(event_id: str, db: Session = Depends(get_db)) -> LedgerEventOut:
    row = service.get_event(db, event_id)
    if row is None:
        raise HTTPException(status_code=404, detail="ledger event not found")
    return LedgerEventOut.model_validate(row)
