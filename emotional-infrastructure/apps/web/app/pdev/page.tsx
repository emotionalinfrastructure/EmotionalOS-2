"use client";

import { useState } from "react";
import { apiPost, ApiError } from "@/lib/api";
import { makeDefaultContext, type PDEVResponse } from "@/lib/types";
import { JsonBlock } from "@/components/JsonBlock";
import { StatusPill } from "@/components/StatusPill";

export default function PDEVPage() {
  const [sub, setSub] = useState("user-42");
  const [purpose, setPurpose] = useState("wellbeing_support");
  const [requestedFeature, setRequestedFeature] = useState("stabilization_prompt");
  const [token, setToken] = useState("");
  const [signalTier, setSignalTier] = useState(0);
  const [actionRisk, setActionRisk] = useState("low");
  const [stepUpConfirmed, setStepUpConfirmed] = useState(false);
  const [vetoRequested, setVetoRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PDEVResponse | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiPost<PDEVResponse>("/pdev/evaluate", {
        sub,
        purpose,
        requested_feature: requestedFeature,
        token: token || undefined,
        context: token ? makeDefaultContext() : undefined,
        signal_tier: signalTier,
        action_risk: actionRisk,
        step_up_confirmed: stepUpConfirmed,
        veto_requested: vetoRequested,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body) : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">PDEV Evaluation</h1>
      <p className="page-subtitle">
        Calls <code>POST /pdev/evaluate</code>. Runs the Purpose, Dignity, Evidence, and Veto gates
        and returns the real, per-gate pass/fail result plus a combined decision.
      </p>
      <p className="page-subtitle">
        Note: leaving Token blank will always fail the Evidence gate (no consent token presented).
        Paste a token minted on the Issue Token page to see an allow/review case; the context
        envelope sent here is freshly generated, so it will only hash-match a token issued moments
        earlier by this same demo flow if you use the process/validate pages directly.
      </p>

      <form className="card" onSubmit={onSubmit}>
        <h2>Request</h2>
        <div className="form-grid">
          <div className="form-row">
            <label>Subject (sub)</label>
            <input value={sub} onChange={(e) => setSub(e.target.value)} required />
          </div>
          <div className="form-row">
            <label>Purpose</label>
            <input value={purpose} onChange={(e) => setPurpose(e.target.value)} required />
          </div>
        </div>
        <div className="form-row">
          <label>Requested feature</label>
          <input value={requestedFeature} onChange={(e) => setRequestedFeature(e.target.value)} required />
        </div>
        <div className="form-row">
          <label>Consent token (optional -- omit to test the Evidence gate failing)</label>
          <textarea value={token} onChange={(e) => setToken(e.target.value)} />
        </div>
        <div className="form-grid">
          <div className="form-row">
            <label>Signal tier</label>
            <select value={signalTier} onChange={(e) => setSignalTier(Number(e.target.value))}>
              <option value={0}>0 -- Basal state</option>
              <option value={1}>1 -- Operational stress</option>
              <option value={2}>2 -- Vulnerability markers</option>
              <option value={3}>3 -- Manipulation vectors</option>
            </select>
          </div>
          <div className="form-row">
            <label>Action risk</label>
            <select value={actionRisk} onChange={(e) => setActionRisk(e.target.value)}>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="irreversible">irreversible</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <label><input type="checkbox" checked={stepUpConfirmed} onChange={(e) => setStepUpConfirmed(e.target.checked)} style={{ width: "auto", marginRight: 8 }} />Step-up confirmed</label>
        </div>
        <div className="form-row">
          <label><input type="checkbox" checked={vetoRequested} onChange={(e) => setVetoRequested(e.target.checked)} style={{ width: "auto", marginRight: 8 }} />Veto requested</label>
        </div>
        <button className="primary" type="submit" disabled={loading}>
          {loading ? "Evaluating…" : "Evaluate PDEV gates"}
        </button>
      </form>

      {error && <div className="error-block">{error}</div>}

      {result && (
        <div className="card">
          <h2>Response</h2>
          <div style={{ display: "flex", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
            <div>Decision: <StatusPill value={result.decision} /></div>
            <div>Purpose: <StatusPill value={result.purpose} /></div>
            <div>Dignity: <StatusPill value={result.dignity} /></div>
            <div>Evidence: <StatusPill value={result.evidence} /></div>
            <div>Veto: <StatusPill value={result.veto} /></div>
          </div>
          <JsonBlock data={result} />
        </div>
      )}
    </div>
  );
}
