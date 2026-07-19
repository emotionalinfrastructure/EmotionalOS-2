"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import type { PolicyEvaluateResponse, PolicyRule } from "@/lib/types";
import { JsonBlock } from "@/components/JsonBlock";
import { StatusPill } from "@/components/StatusPill";

export default function PolicyPage() {
  const [rules, setRules] = useState<PolicyRule[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [signalTier, setSignalTier] = useState(0);
  const [tokenPresent, setTokenPresent] = useState(true);
  const [tokenValid, setTokenValid] = useState(true);
  const [tokenRevoked, setTokenRevoked] = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [evalResult, setEvalResult] = useState<PolicyEvaluateResponse | null>(null);

  async function loadRules() {
    setLoading(true);
    setError(null);
    try {
      setRules(await apiGet<PolicyRule[]>("/policy/rules"));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRules();
  }, []);

  async function onEvaluate(e: React.FormEvent) {
    e.preventDefault();
    setEvalLoading(true);
    setEvalError(null);
    setEvalResult(null);
    try {
      const res = await apiPost<PolicyEvaluateResponse>("/policy/evaluate", {
        token_present: tokenPresent,
        token_valid: tokenValid,
        token_revoked: tokenRevoked,
        signal_tier: signalTier,
      });
      setEvalResult(res);
    } catch (err) {
      setEvalError(err instanceof ApiError ? JSON.stringify(err.body) : String(err));
    } finally {
      setEvalLoading(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Policy Rules</h1>
      <p className="page-subtitle">
        Rule-based decision layer. <code>GET /policy/rules</code> lists every active rule;{" "}
        <code>POST /policy/evaluate</code> walks them in priority order against a submitted context.
      </p>

      <form className="card" onSubmit={onEvaluate}>
        <h2>Evaluate -- POST /policy/evaluate</h2>
        <div className="form-grid">
          <div className="form-row">
            <label>Signal tier</label>
            <select value={signalTier} onChange={(e) => setSignalTier(Number(e.target.value))}>
              <option value={0}>0</option>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </div>
          <div className="form-row">
            <label><input type="checkbox" checked={tokenPresent} onChange={(e) => setTokenPresent(e.target.checked)} style={{ width: "auto", marginRight: 8 }} />Token present</label>
          </div>
          <div className="form-row">
            <label><input type="checkbox" checked={tokenValid} onChange={(e) => setTokenValid(e.target.checked)} style={{ width: "auto", marginRight: 8 }} />Token valid</label>
          </div>
          <div className="form-row">
            <label><input type="checkbox" checked={tokenRevoked} onChange={(e) => setTokenRevoked(e.target.checked)} style={{ width: "auto", marginRight: 8 }} />Token revoked</label>
          </div>
        </div>
        <button className="primary" type="submit" disabled={evalLoading}>
          {evalLoading ? "Evaluating…" : "Evaluate policy"}
        </button>
        {evalError && <div className="error-block">{evalError}</div>}
        {evalResult && (
          <div style={{ marginTop: 14 }}>
            <div style={{ marginBottom: 8 }}>
              <StatusPill value={evalResult.decision} /> <span style={{ marginLeft: 8 }}>{evalResult.matched_rule}</span>
            </div>
            <JsonBlock data={evalResult} />
          </div>
        )}
      </form>

      {error && <div className="error-block">{error}</div>}
      {loading && <p className="loading">Loading policy rules…</p>}

      {!loading && rules && (
        <div className="card">
          <h2>Rules ({rules.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Priority</th>
                <th>Name</th>
                <th>Decision</th>
                <th>Active</th>
                <th>Default</th>
              </tr>
            </thead>
            <tbody>
              {rules
                .slice()
                .sort((a, b) => a.priority - b.priority)
                .map((r) => (
                  <tr key={r.id}>
                    <td>{r.priority}</td>
                    <td>{r.name}<div className="page-subtitle" style={{ margin: 0 }}>{r.description}</div></td>
                    <td><StatusPill value={r.decision} /></td>
                    <td>{r.active ? "yes" : "no"}</td>
                    <td>{r.is_default ? "yes" : "no"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
