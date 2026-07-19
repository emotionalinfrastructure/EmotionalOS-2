"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import type { TrajectoryResponse } from "@/lib/types";
import { JsonBlock } from "@/components/JsonBlock";
import { StatusPill } from "@/components/StatusPill";

interface TrajectoryEvaluationOut {
  id: string;
  domain: string;
  trajectory_status: string;
  recommended_action: string;
  event_count: number;
  created_at: string;
}

function sampleEvents(count: number, substitutionHeavy: boolean) {
  return Array.from({ length: count }, (_, i) => ({
    type: substitutionHeavy && i % 2 === 0 ? "task_substitution" : "check_in",
    actor: i % 3 === 0 ? "user" : "system",
    ts: new Date(Date.now() - (count - i) * 3_600_000).toISOString(),
  }));
}

export default function TrajectoryPage() {
  const [domain, setDomain] = useState("wellbeing");
  const [timeWindow, setTimeWindow] = useState("7d");
  const [supportMode, setSupportMode] = useState("companion");
  const [eventCount, setEventCount] = useState(3);
  const [substitutionHeavy, setSubstitutionHeavy] = useState(false);
  const [centralityTrend, setCentralityTrend] = useState("stable");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrajectoryResponse | null>(null);
  const [history, setHistory] = useState<TrajectoryEvaluationOut[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);

  async function loadHistory() {
    try {
      const rows = await apiGet<TrajectoryEvaluationOut[]>("/trajectory/evaluations?limit=20");
      setHistory(rows);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiPost<TrajectoryResponse>("/trajectory/evaluate", {
        domain,
        time_window: timeWindow,
        support_mode: supportMode,
        system_events: sampleEvents(eventCount, substitutionHeavy),
        interaction_pattern_summary: { centrality_trend: centralityTrend },
      });
      setResult(res);
      await loadHistory();
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body) : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Trajectory Governance</h1>
      <p className="page-subtitle">
        Calls <code>POST /trajectory/evaluate</code>. Evaluates system-level event patterns only --
        never raw conversation content -- for attenuation, proportionality, contestability, and
        symmetry of adaptation.
      </p>

      <form className="card" onSubmit={onSubmit}>
        <h2>Request</h2>
        <div className="form-grid">
          <div className="form-row">
            <label>Domain</label>
            <input value={domain} onChange={(e) => setDomain(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Time window</label>
            <input value={timeWindow} onChange={(e) => setTimeWindow(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Support mode</label>
            <input value={supportMode} onChange={(e) => setSupportMode(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Centrality trend</label>
            <select value={centralityTrend} onChange={(e) => setCentralityTrend(e.target.value)}>
              <option value="stable">stable</option>
              <option value="decreasing">decreasing</option>
              <option value="increasing">increasing</option>
            </select>
          </div>
          <div className="form-row">
            <label>Sample event count</label>
            <input type="number" min={0} max={30} value={eventCount} onChange={(e) => setEventCount(Number(e.target.value))} />
          </div>
          <div className="form-row">
            <label><input type="checkbox" checked={substitutionHeavy} onChange={(e) => setSubstitutionHeavy(e.target.checked)} style={{ width: "auto", marginRight: 8 }} />Substitution-heavy sample events</label>
          </div>
        </div>
        <p className="page-subtitle">
          Below 5 events the evaluation reports <code>insufficient_data</code>; below the spec&apos;s
          minimum-events threshold this is by design, not an error.
        </p>
        <button className="primary" type="submit" disabled={loading}>
          {loading ? "Evaluating…" : "Evaluate trajectory"}
        </button>
      </form>

      {error && <div className="error-block">{error}</div>}

      {result && (
        <div className="card">
          <h2>Response</h2>
          <div style={{ marginBottom: 10 }}>
            <StatusPill value={result.trajectory_status} /> <span style={{ marginLeft: 8 }}>{result.recommended_action}</span>
          </div>
          <JsonBlock data={result} />
        </div>
      )}

      <div className="card">
        <h2>Recent evaluations</h2>
        {historyError && <div className="error-block">{historyError}</div>}
        {history.length === 0 ? (
          <p className="page-subtitle">No evaluations yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Domain</th>
                <th>Status</th>
                <th>Recommended action</th>
                <th>Events</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td>{h.domain}</td>
                  <td><StatusPill value={h.trajectory_status} /></td>
                  <td>{h.recommended_action}</td>
                  <td>{h.event_count}</td>
                  <td>{new Date(h.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
