"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api";
import { makeDefaultContext, type ValidateResponse } from "@/lib/types";
import { JsonBlock } from "@/components/JsonBlock";
import { StatusPill } from "@/components/StatusPill";

export default function ValidateTokenPage() {
  const [token, setToken] = useState("");
  const [contextJson, setContextJson] = useState(JSON.stringify(makeDefaultContext(), null, 2));
  const [expectedScope, setExpectedScope] = useState("");
  const [expectedPurpose, setExpectedPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ValidateResponse | null>(null);
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
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/ctp/validate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            context,
            expected_scope: expectedScope || undefined,
            expected_purpose: expectedPurpose || undefined,
          }),
        },
      );
      setHttpStatus(res.status);
      const body = await res.json();
      setResult(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Validate Token</h1>
      <p className="page-subtitle">
        Calls <code>POST /ctp/validate</code>. Returns 200 on allow, 400 on context mismatch, 401 for
        missing/expired/invalid/malformed/revoked tokens, and 403 for scope or purpose mismatch.
      </p>

      <form className="card" onSubmit={onSubmit}>
        <h2>Request</h2>
        <div className="form-row">
          <label>Token (JWT)</label>
          <textarea value={token} onChange={(e) => setToken(e.target.value)} required />
        </div>
        <div className="form-row">
          <label>Context envelope (JSON)</label>
          <textarea value={contextJson} onChange={(e) => setContextJson(e.target.value)} required />
        </div>
        <div className="form-grid">
          <div className="form-row">
            <label>Expected scope (optional)</label>
            <input value={expectedScope} onChange={(e) => setExpectedScope(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Expected purpose (optional)</label>
            <input value={expectedPurpose} onChange={(e) => setExpectedPurpose(e.target.value)} />
          </div>
        </div>
        <button className="primary" type="submit" disabled={loading}>
          {loading ? "Validating…" : "Validate token"}
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
