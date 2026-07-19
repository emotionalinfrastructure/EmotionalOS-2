"use client";

import { useEffect, useState } from "react";
import { apiGet, API_BASE_URL } from "@/lib/api";
import type { LedgerEvent, LedgerVerifyResult } from "@/lib/types";
import { StatusPill } from "@/components/StatusPill";

export default function LedgerPage() {
  const [events, setEvents] = useState<LedgerEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifyResult, setVerifyResult] = useState<LedgerVerifyResult | null>(null);
  const [verifying, setVerifying] = useState(false);

  async function loadEvents() {
    setLoading(true);
    setError(null);
    try {
      const rows = await apiGet<LedgerEvent[]>("/ledger/events?limit=200");
      setEvents(rows.slice().reverse());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function onVerify() {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await apiGet<LedgerVerifyResult>("/ledger/verify");
      setVerifyResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Dignity Ledger</h1>
      <p className="page-subtitle">
        Append-only, hash-chained record of every governance decision (allow/deny/review/vetoed).
        No raw message content or raw emotional content is ever stored -- only decision metadata.
      </p>

      <div className="card">
        <h2>Chain verification -- GET /ledger/verify</h2>
        <button className="primary" onClick={onVerify} disabled={verifying}>
          {verifying ? "Verifying…" : "Verify chain"}
        </button>
        <button className="secondary" style={{ marginLeft: 10 }} onClick={loadEvents}>
          Refresh events
        </button>
        <span style={{ marginLeft: 12 }}>
          <a href={`${API_BASE_URL}/ledger/export.json`} target="_blank" rel="noreferrer">export.json</a>
          {" · "}
          <a href={`${API_BASE_URL}/ledger/export.csv`} target="_blank" rel="noreferrer">export.csv</a>
        </span>
        {verifyResult && (
          <div style={{ marginTop: 14 }}>
            <StatusPill value={verifyResult.valid ? "allow" : "deny"} />{" "}
            <span style={{ marginLeft: 8 }}>
              {verifyResult.events_checked} events checked
              {verifyResult.reason ? ` -- ${verifyResult.reason}` : ""}
            </span>
          </div>
        )}
      </div>

      {error && <div className="error-block">{error}</div>}
      {loading && <p className="loading">Loading ledger events…</p>}

      {!loading && events && (
        <div className="card">
          <h2>Events ({events.length})</h2>
          {events.length === 0 ? (
            <p className="page-subtitle">No ledger events yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Seq</th>
                  <th>Decision</th>
                  <th>Action</th>
                  <th>Sub</th>
                  <th>Signal</th>
                  <th>Block hash</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.event_id}>
                    <td>{e.sequence}</td>
                    <td><StatusPill value={e.decision} /></td>
                    <td>{e.pdev_action ?? "--"}</td>
                    <td>{e.sub ?? "--"}</td>
                    <td>{e.signal_category ?? "--"}</td>
                    <td><code className="hash">{e.block_hash.slice(0, 16)}…</code></td>
                    <td>{new Date(e.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
