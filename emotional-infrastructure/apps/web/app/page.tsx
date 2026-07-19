"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, API_BASE_URL } from "@/lib/api";
import type { LedgerEvent, PolicyRule } from "@/lib/types";
import { StatusPill } from "@/components/StatusPill";

interface HealthResponse {
  status: string;
  service: string;
}

export default function DashboardPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [ledgerEvents, setLedgerEvents] = useState<LedgerEvent[] | null>(null);
  const [policyRules, setPolicyRules] = useState<PolicyRule[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [h, events, rules] = await Promise.all([
          apiGet<HealthResponse>("/health"),
          apiGet<LedgerEvent[]>("/ledger/events?limit=10"),
          apiGet<PolicyRule[]>("/policy/rules"),
        ]);
        if (!cancelled) {
          setHealth(h);
          setLedgerEvents(events.slice().reverse());
          setPolicyRules(rules);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to reach the governance API");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className="page-title">Governance Dashboard</h1>
      <p className="page-subtitle">
        Live status of the Emotional Infrastructure Governance Runtime -- a candidate governance
        architecture / reference implementation, not a certified or production-validated system.
      </p>

      <div className="claim-banner">
        API base URL: <code>{API_BASE_URL}</code>. Every figure below is read live from the backend;
        nothing on this page is hardcoded.
      </div>

      {error && (
        <div className="error-block">
          Could not reach the governance API at {API_BASE_URL}. Is the backend running?
          <div style={{ marginTop: 6 }}>{error}</div>
        </div>
      )}

      {loading && !error && <p className="loading">Loading live status…</p>}

      {!loading && !error && (
        <>
          <div className="form-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            <div className="card">
              <h2>API status</h2>
              <StatusPill value={health?.status ?? "unknown"} />
              <p className="page-subtitle" style={{ marginTop: 10 }}>{health?.service}</p>
            </div>
            <div className="card">
              <h2>Active policy rules</h2>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{policyRules?.filter((r) => r.active).length ?? 0}</div>
              <p className="page-subtitle" style={{ marginTop: 6 }}>of {policyRules?.length ?? 0} total</p>
            </div>
            <div className="card">
              <h2>Ledger events (recent)</h2>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{ledgerEvents?.length ?? 0}</div>
              <p className="page-subtitle" style={{ marginTop: 6 }}>
                <Link href="/ledger">view full ledger &rarr;</Link>
              </p>
            </div>
          </div>

          <div className="card">
            <h2>Most recent Dignity Ledger events</h2>
            {ledgerEvents && ledgerEvents.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Seq</th>
                    <th>Decision</th>
                    <th>Action</th>
                    <th>Sub</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerEvents.map((e) => (
                    <tr key={e.event_id}>
                      <td>{e.sequence}</td>
                      <td><StatusPill value={e.decision} /></td>
                      <td>{e.pdev_action ?? "--"}</td>
                      <td>{e.sub ?? "--"}</td>
                      <td>{new Date(e.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="page-subtitle">No ledger events yet. Try issuing a CTP token.</p>
            )}
          </div>

          <div className="card">
            <h2>Governance modules</h2>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
              <li><Link href="/ctp/issue">Consent Token Protocol (CTP)</Link> -- issue, validate, revoke, gated processing</li>
              <li><Link href="/pdev">PDEV Middleware</Link> -- Purpose / Dignity / Evidence / Veto gates</li>
              <li><Link href="/egl">Emotional Governance Layer (EGL)</Link> -- signal tiers, circuit breaker, step-up</li>
              <li><Link href="/tar">Temporal Affective Regulation (TAR)</Link> -- inference vs. authorization</li>
              <li><Link href="/trajectory">Trajectory Governance</Link> -- longitudinal authority-formation checks</li>
              <li><Link href="/ledger">Dignity Ledger</Link> -- hash-chained governance decision log</li>
              <li><Link href="/policy">Policy Engine</Link> -- rule-based decision layer</li>
              <li><Link href="/claim-boundary">Claim Boundary Scanner</Link> -- overclaim detection</li>
              <li><Link href="/eimm">EIMM Assessment</Link> -- maturity self-assessment</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
