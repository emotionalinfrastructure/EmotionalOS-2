"use client";

import { useState } from "react";
import { apiPost, ApiError } from "@/lib/api";
import type { RevokeResponse } from "@/lib/types";
import { JsonBlock } from "@/components/JsonBlock";

export default function RevokeTokenPage() {
  const [jti, setJti] = useState("");
  const [reason, setReason] = useState("revoked_by_holder");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RevokeResponse | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiPost<RevokeResponse>("/ctp/revoke", { jti, reason });
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body) : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Revoke Token</h1>
      <p className="page-subtitle">
        Calls <code>POST /ctp/revoke</code>. Adds the token&apos;s <code>jti</code> to the revocation
        list; subsequent <code>/ctp/validate</code> or <code>/ctp/process</code> calls will deny it.
      </p>

      <form className="card" onSubmit={onSubmit}>
        <h2>Request</h2>
        <div className="form-row">
          <label>Token ID (jti)</label>
          <input value={jti} onChange={(e) => setJti(e.target.value)} required placeholder="paste the jti from Issue Token" />
        </div>
        <div className="form-row">
          <label>Reason</label>
          <input value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <button className="primary" type="submit" disabled={loading}>
          {loading ? "Revoking…" : "Revoke token"}
        </button>
      </form>

      {error && <div className="error-block">{error}</div>}

      {result && (
        <div className="card">
          <h2>Response</h2>
          <JsonBlock data={result} />
        </div>
      )}
    </div>
  );
}
