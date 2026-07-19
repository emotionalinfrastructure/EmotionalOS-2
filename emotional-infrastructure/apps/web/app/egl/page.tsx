"use client";

import { useState } from "react";
import { apiPost, ApiError } from "@/lib/api";
import type { CircuitBreakerResponse, ClassifySignalResponse, ConsentStepUpResponse } from "@/lib/types";
import { JsonBlock } from "@/components/JsonBlock";
import { StatusPill } from "@/components/StatusPill";

export default function EGLPage() {
  return (
    <div>
      <h1 className="page-title">EGL Signal Tiers</h1>
      <p className="page-subtitle">
        Emotional Governance Layer: classifies behavioral signal magnitudes into governance tiers,
        runs the dynamic circuit breaker, and evaluates consent step-up for high-risk actions.
      </p>
      <ClassifySignalCard />
      <CircuitBreakerCard />
      <ConsentStepUpCard />
    </div>
  );
}

function ClassifySignalCard() {
  const [sub, setSub] = useState("user-42");
  const [exhaustionScore, setExhaustionScore] = useState(0);
  const [attachmentScore, setAttachmentScore] = useState(0);
  const [urgencyScore, setUrgencyScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClassifySignalResponse | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiPost<ClassifySignalResponse>("/egl/classify-signal", {
        sub,
        features: {
          exhaustion_score: exhaustionScore,
          attachment_building_score: attachmentScore,
          urgency_score: urgencyScore,
        },
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body) : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h2>Classify signal -- POST /egl/classify-signal</h2>
      <div className="form-grid">
        <div className="form-row">
          <label>Subject (sub)</label>
          <input value={sub} onChange={(e) => setSub(e.target.value)} />
        </div>
        <div className="form-row">
          <label>Urgency score (0-1)</label>
          <input type="number" min={0} max={1} step={0.05} value={urgencyScore} onChange={(e) => setUrgencyScore(Number(e.target.value))} />
        </div>
        <div className="form-row">
          <label>Exhaustion score (0-1)</label>
          <input type="number" min={0} max={1} step={0.05} value={exhaustionScore} onChange={(e) => setExhaustionScore(Number(e.target.value))} />
        </div>
        <div className="form-row">
          <label>Attachment-building score (0-1)</label>
          <input type="number" min={0} max={1} step={0.05} value={attachmentScore} onChange={(e) => setAttachmentScore(Number(e.target.value))} />
        </div>
      </div>
      <button className="primary" type="submit" disabled={loading}>
        {loading ? "Classifying…" : "Classify signal"}
      </button>
      {error && <div className="error-block">{error}</div>}
      {result && (
        <div style={{ marginTop: 14 }}>
          <div style={{ marginBottom: 8 }}>
            Tier {result.tier} ({result.tier_label}) <StatusPill value={result.decision} />
          </div>
          <JsonBlock data={result} />
        </div>
      )}
    </form>
  );
}

function CircuitBreakerCard() {
  const [sub, setSub] = useState("user-42");
  const [cognitiveLoad, setCognitiveLoad] = useState("low");
  const [emotionalState, setEmotionalState] = useState("stable_flow");
  const [actionRisk, setActionRisk] = useState("low");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CircuitBreakerResponse | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiPost<CircuitBreakerResponse>("/egl/evaluate-circuit-breaker", {
        sub,
        cognitive_load: cognitiveLoad,
        emotional_state: emotionalState,
        action_risk: actionRisk,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body) : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h2>Dynamic circuit breaker -- POST /egl/evaluate-circuit-breaker</h2>
      <div className="form-grid">
        <div className="form-row">
          <label>Cognitive load</label>
          <select value={cognitiveLoad} onChange={(e) => setCognitiveLoad(e.target.value)}>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </div>
        <div className="form-row">
          <label>Emotional state</label>
          <select value={emotionalState} onChange={(e) => setEmotionalState(e.target.value)}>
            <option value="stable_flow">stable_flow</option>
            <option value="distress_vulnerable">distress_vulnerable</option>
            <option value="unknown">unknown</option>
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
      <button className="primary" type="submit" disabled={loading}>
        {loading ? "Evaluating…" : "Evaluate circuit breaker"}
      </button>
      {error && <div className="error-block">{error}</div>}
      {result && (
        <div style={{ marginTop: 14 }}>
          <div style={{ marginBottom: 8 }}><StatusPill value={result.breaker_action} /></div>
          <JsonBlock data={result} />
        </div>
      )}
    </form>
  );
}

function ConsentStepUpCard() {
  const [sub, setSub] = useState("user-42");
  const [tier, setTier] = useState(2);
  const [actionRisk, setActionRisk] = useState("high");
  const [confirmationType, setConfirmationType] = useState("typed_confirmation");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConsentStepUpResponse | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiPost<ConsentStepUpResponse>("/egl/consent-step-up", {
        sub,
        tier,
        action_risk: actionRisk,
        confirmation_type: confirmationType,
        confirmed,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body) : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h2>Consent step-up -- POST /egl/consent-step-up</h2>
      <div className="form-grid">
        <div className="form-row">
          <label>Tier</label>
          <select value={tier} onChange={(e) => setTier(Number(e.target.value))}>
            <option value={0}>0</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
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
        <div className="form-row">
          <label>Confirmation type</label>
          <select value={confirmationType} onChange={(e) => setConfirmationType(e.target.value)}>
            <option value="typed_confirmation">typed_confirmation</option>
            <option value="cooldown_delay">cooldown_delay</option>
          </select>
        </div>
        <div className="form-row">
          <label><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} style={{ width: "auto", marginRight: 8 }} />Confirmed</label>
        </div>
      </div>
      <button className="primary" type="submit" disabled={loading}>
        {loading ? "Checking…" : "Evaluate step-up"}
      </button>
      {error && <div className="error-block">{error}</div>}
      {result && (
        <div style={{ marginTop: 14 }}>
          <div style={{ marginBottom: 8 }}><StatusPill value={result.status} /> {result.required ? "(required)" : "(not required)"}</div>
          <JsonBlock data={result} />
        </div>
      )}
    </form>
  );
}
