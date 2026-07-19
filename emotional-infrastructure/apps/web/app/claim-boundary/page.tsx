"use client";

import { useState } from "react";
import { apiPost, ApiError } from "@/lib/api";
import type { ClaimScanResponse } from "@/lib/types";
import { StatusPill } from "@/components/StatusPill";

const SAMPLE_TEXT =
  "Our governance runtime is fully certified, production-ready, and guaranteed compliant with all applicable regulations.";

export default function ClaimBoundaryPage() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClaimScanResponse | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiPost<ClaimScanResponse>("/claim-boundary/scan", { text, source_label: "dashboard_demo" });
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body) : String(err));
    } finally {
      setLoading(false);
    }
  }

  function highlightedText() {
    if (!result || result.flagged_terms.length === 0) return text;
    let cursor = 0;
    const parts: React.ReactNode[] = [];
    result.flagged_terms.forEach((f, i) => {
      parts.push(text.slice(cursor, f.start));
      parts.push(
        <mark key={i} style={{ background: "var(--danger-soft)", color: "var(--danger)", padding: "0 2px" }}>
          {text.slice(f.start, f.end)}
        </mark>,
      );
      cursor = f.end;
    });
    parts.push(text.slice(cursor));
    return parts;
  }

  return (
    <div>
      <h1 className="page-title">Claim Boundary Scanner</h1>
      <p className="page-subtitle">
        Calls <code>POST /claim-boundary/scan</code>. Flags restricted overclaiming language
        (&quot;certified&quot;, &quot;production-ready&quot;, etc.) in public-facing copy and suggests
        claim-disciplined replacements.
      </p>

      <form className="card" onSubmit={onSubmit}>
        <h2>Scan text</h2>
        <div className="form-row">
          <label>Text</label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} style={{ minHeight: 120 }} />
        </div>
        <button className="primary" type="submit" disabled={loading}>
          {loading ? "Scanning…" : "Scan for restricted claims"}
        </button>
      </form>

      {error && <div className="error-block">{error}</div>}

      {result && (
        <div className="card">
          <h2>Result <StatusPill value={result.passed ? "allow" : "deny"} /></h2>
          <p style={{ lineHeight: 1.7 }}>{highlightedText()}</p>
          {result.flagged_terms.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Term</th>
                  <th>Suggested replacement</th>
                </tr>
              </thead>
              <tbody>
                {result.flagged_terms.map((f, i) => (
                  <tr key={i}>
                    <td>{f.matched_text}</td>
                    <td>{f.suggested_replacement}</td>
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
