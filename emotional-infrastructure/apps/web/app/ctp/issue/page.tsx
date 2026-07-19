"use client";

import { useState } from "react";
import { apiPost, ApiError } from "@/lib/api";
import { makeDefaultContext, type IssueResponse } from "@/lib/types";
import { JsonBlock } from "@/components/JsonBlock";

export default function IssueTokenPage() {
  const [sub, setSub] = useState("user-42");
  const [scope, setScope] = useState("signal.process");
  const [purpose, setPurpose] = useState("wellbeing_support");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IssueResponse | null>(null);
  const [sentContext, setSentContext] = useState<unknown>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const context = makeDefaultContext();
      const res = await apiPost<IssueResponse>("/ctp/issue", { sub, scope, purpose, context });
      setResult(res);
      setSentContext(context);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body) : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Issue CTP Token</h1>
      <p className="page-subtitle">
        Calls <code>POST /ctp/issue</code>. Signs an ES256 JWT with a 300-second maximum lifetime, a
        canonical context envelope, and a SHA-256 context hash, then writes a Dignity Ledger event.
      </p>

      <form className="card" onSubmit={onSubmit}>
        <h2>Request</h2>
        <div className="form-grid">
          <div className="form-row">
            <label>Subject (sub)</label>
            <input value={sub} onChange={(e) => setSub(e.target.value)} required />
          </div>
          <div className="form-row">
            <label>Scope</label>
            <input value={scope} onChange={(e) => setScope(e.target.value)} required />
          </div>
          <div className="form-row">
            <label>Purpose</label>
            <input value={purpose} onChange={(e) => setPurpose(e.target.value)} required />
          </div>
        </div>
        <button className="primary" type="submit" disabled={loading}>
          {loading ? "Issuing…" : "Issue token"}
        </button>
      </form>

      {error && <div className="error-block">{error}</div>}

      {result && (
        <div className="card">
          <h2>Response</h2>
          <JsonBlock data={result} />
          <p className="page-subtitle" style={{ marginTop: 14 }}>
            Context envelope sent (copy this into Validate Token to reproduce the exact context_hash):
          </p>
          <JsonBlock data={sentContext} />
        </div>
      )}
    </div>
  );
}
