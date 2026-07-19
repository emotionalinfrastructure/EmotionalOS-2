"use client";

import { useState } from "react";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import type { AuthorizationOut, TAREvaluateResponse } from "@/lib/types";
import { JsonBlock } from "@/components/JsonBlock";
import { StatusPill } from "@/components/StatusPill";

export default function TARPage() {
  const [sub, setSub] = useState("user-42");
  const [inferenceRef, setInferenceRef] = useState("inf-ref-1");
  const [authorizedAction, setAuthorizedAction] = useState("send_checkin");
  const [actionRisk, setActionRisk] = useState("medium");
  const [ttlSeconds, setTtlSeconds] = useState(300);
  const [escalationAllowed, setEscalationAllowed] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authorization, setAuthorization] = useState<AuthorizationOut | null>(null);

  const [requestedActionRisk, setRequestedActionRisk] = useState("medium");
  const [requestedEscalation, setRequestedEscalation] = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [evalResult, setEvalResult] = useState<TAREvaluateResponse | null>(null);

  async function onAuthorize(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthorization(null);
    try {
      const res = await apiPost<AuthorizationOut>("/tar/authorize", {
        sub,
        inference_ref: inferenceRef,
        authorized_action: authorizedAction,
        action_risk: actionRisk,
        ttl_seconds: ttlSeconds,
        escalation_allowed: escalationAllowed,
      });
      setAuthorization(res);
    } catch (err) {
      setAuthError(err instanceof ApiError ? JSON.stringify(err.body) : String(err));
    } finally {
      setAuthLoading(false);
    }
  }

  async function onEvaluate(e: React.FormEvent) {
    e.preventDefault();
    if (!authorization) return;
    setEvalLoading(true);
    setEvalError(null);
    setEvalResult(null);
    try {
      const res = await apiPost<TAREvaluateResponse>("/tar/evaluate", {
        authorization_id: authorization.id,
        requested_action_risk: requestedActionRisk,
        requested_escalation: requestedEscalation,
      });
      setEvalResult(res);
    } catch (err) {
      setEvalError(err instanceof ApiError ? JSON.stringify(err.body) : String(err));
    } finally {
      setEvalLoading(false);
    }
  }

  async function refreshAuthorization() {
    if (!authorization) return;
    const res = await apiGet<AuthorizationOut>(`/tar/authorizations/${authorization.id}`);
    setAuthorization(res);
  }

  return (
    <div>
      <h1 className="page-title">TAR Authorization</h1>
      <p className="page-subtitle">
        Temporal Affective Regulation: an inference reference existing does not itself authorize
        action. <code>POST /tar/authorize</code> creates a time-boxed authorization;{" "}
        <code>POST /tar/evaluate</code> checks whether an action is still valid within it.
      </p>

      <form className="card" onSubmit={onAuthorize}>
        <h2>Create authorization -- POST /tar/authorize</h2>
        <div className="form-grid">
          <div className="form-row">
            <label>Subject (sub)</label>
            <input value={sub} onChange={(e) => setSub(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Inference reference</label>
            <input value={inferenceRef} onChange={(e) => setInferenceRef(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Authorized action</label>
            <input value={authorizedAction} onChange={(e) => setAuthorizedAction(e.target.value)} />
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
          <div className="form-row">
            <label>TTL (seconds)</label>
            <input type="number" min={1} value={ttlSeconds} onChange={(e) => setTtlSeconds(Number(e.target.value))} />
          </div>
          <div className="form-row">
            <label><input type="checkbox" checked={escalationAllowed} onChange={(e) => setEscalationAllowed(e.target.checked)} style={{ width: "auto", marginRight: 8 }} />Escalation allowed</label>
          </div>
        </div>
        <button className="primary" type="submit" disabled={authLoading}>
          {authLoading ? "Authorizing…" : "Create authorization"}
        </button>
        {authError && <div className="error-block">{authError}</div>}
        {authorization && (
          <div style={{ marginTop: 14 }}>
            <div style={{ marginBottom: 8 }}>
              <StatusPill value={authorization.status} />{" "}
              <button type="button" className="secondary" onClick={refreshAuthorization} style={{ marginLeft: 8 }}>
                Refresh status
              </button>
            </div>
            <JsonBlock data={authorization} />
          </div>
        )}
      </form>

      <form className="card" onSubmit={onEvaluate}>
        <h2>Evaluate action -- POST /tar/evaluate</h2>
        {!authorization && <p className="page-subtitle">Create an authorization above first.</p>}
        <div className="form-grid">
          <div className="form-row">
            <label>Requested action risk</label>
            <select value={requestedActionRisk} onChange={(e) => setRequestedActionRisk(e.target.value)}>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="irreversible">irreversible</option>
            </select>
          </div>
          <div className="form-row">
            <label><input type="checkbox" checked={requestedEscalation} onChange={(e) => setRequestedEscalation(e.target.checked)} style={{ width: "auto", marginRight: 8 }} />Requested escalation</label>
          </div>
        </div>
        <button className="primary" type="submit" disabled={evalLoading || !authorization}>
          {evalLoading ? "Evaluating…" : "Evaluate against authorization"}
        </button>
        {evalError && <div className="error-block">{evalError}</div>}
        {evalResult && (
          <div style={{ marginTop: 14 }}>
            <div style={{ marginBottom: 8 }}><StatusPill value={evalResult.decision} /></div>
            <JsonBlock data={evalResult} />
          </div>
        )}
      </form>
    </div>
  );
}
