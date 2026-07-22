from fastapi import FastAPI, HTTPException
from .models import ProcessRequest, ProcessResponse, LedgerExport
from .eios_adapter import EIOSGateway


async def call_model_backend(payload: dict) -> str:
    user_text = payload.get("user_text", "")
    return f"[MODEL] I hear you saying: {user_text}"


app = FastAPI(
    title="EIOS Gateway",
    description="Emotional Infrastructure Operating System enforcement gateway",
    version="1.0.1",
)

gateway = EIOSGateway()


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "version": "1.0.1"}


@app.post("/process", response_model=ProcessResponse)
async def process_turn(req: ProcessRequest):
    backend_payload = req.model_payload or {"user_text": req.text}

    try:
        model_response = await call_model_backend(backend_payload)
    except Exception as exc:  # pragma: no cover - backend failure
        raise HTTPException(status_code=502, detail=f"Model backend error: {exc}") from exc

    decision = gateway.process(req, model_response_text=model_response)
    return decision


@app.get("/ledger/{session_id}", response_model=LedgerExport)
async def export_ledger(session_id: str):
    all_entries = gateway.export_ledger()
    session_entries = [e for e in all_entries if e["session_id"] == session_id]
    return LedgerExport(entries=session_entries)


@app.get("/ledger", response_model=LedgerExport)
async def export_ledger_all():
    all_entries = gateway.export_ledger()
    return LedgerExport(entries=all_entries)
