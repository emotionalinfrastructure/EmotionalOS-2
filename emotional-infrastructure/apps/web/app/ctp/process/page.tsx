"use client";

import { useState } from "react";
import { makeDefaultContext, type ProcessResponse } from "@/lib/types";
import { JsonBlock } from "@/components/JsonBlock";
import { StatusPill } from "@/components/StatusPill";

export default function ConsentGatedProcessingPage() {
  const [token, setToken] = useState("");
  const [contextJson, setContextJson] = useState(JSON.stringify(makeDefaultContext(), null, 2));
  const [scope, setScope] = useState("signal.process");
  const [purpose, setPurpose] = useState("wellbeing_support");
  const [operation, setOperation] = useState("tempo_adjustment");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResponse | null>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setHttpStatus(null);
    try {
      let context;
      try {
        context = JSON.parse(contextJson);
      } catch {
        throw new Error("Context envelope is not valid JSON");
      }
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/ctp/process`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            context,
            scope,
            purpose,
            payload_descriptor: { operation },
          }),
        },
      );
      setHttpStatus(res.status);
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Consent-Gated Processing</h1>
      <p className="page-subtitle">
        Calls <code>POST /ctp/process</code>. Runs the full CTP validation gate and, only if it
        allows, executes and returns a real processing result with a ledger event id.
      </p>

      <form className="card" onSubmit={onSubmit}>
        <h2>Request</h2>
        <div className="form-row">
          <label>Token (JWT)</label>
          <textarea value={token} onChange={(e) => setToken(e.target.value)} required />
        </div>
        <div className="form-row">
          <label>Context envelope (JSON) -- must match the token&apos;s original context</label>
          <textarea value={contextJson} onChange={(e) => setContextJson(e.target.value)} required />
        </div>
        <div className="form-grid">
          <div className="form-row">
            <label>Scope</label>
            <input value={scope} onChange={(e) => setScope(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Purpose</label>
            <input value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <label>Operation descriptor</label>
          <input value={operation} onChange={(e) => setOperation(e.target.value)} />
        </div>
        <button className="primary" type="submit" disabled={loading}>
          {loading ? "Processing…" : "Submit for consent-gated processing"}
        </button>
      </form>

      {error && <div className="error-block">{error}</div>}

      {result && (
        <div className="card">
          <h2>
            Response {httpStatus !== null && <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(HTTP {httpStatus})</span>}
          </h2>
          <div style={{ marginBottom: 10 }}>
            <StatusPill value={result.decision} /> <span style={{ marginLeft: 8 }}>{result.reason}</span>
          </div>
          <JsonBlock data={result} />
        </div>
      )}
    </div>
  );
}
