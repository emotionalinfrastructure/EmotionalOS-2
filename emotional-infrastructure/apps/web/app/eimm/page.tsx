"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import type { AssessResponse, LevelsResponse } from "@/lib/types";
import { JsonBlock } from "@/components/JsonBlock";
import { StatusPill } from "@/components/StatusPill";

const CRITERIA_KEYS = [
  "governance_documented",
  "signal_taxonomy_defined",
  "consent_protocol_implemented",
  "policy_engine_implemented",
  "audit_trail_implemented",
  "automated_tests_passing",
  "external_audit_completed",
  "regulator_engagement",
  "standards_body_adoption",
  "movement_coalition_formed",
];

export default function EIMMPage() {
  const [levels, setLevels] = useState<LevelsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [criteria, setCriteria] = useState<Record<string, boolean>>(
    Object.fromEntries(CRITERIA_KEYS.map((k) => [k, false])),
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AssessResponse | null>(null);

  useEffect(() => {
    apiGet<LevelsResponse>("/eimm/levels")
      .then(setLevels)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiPost<AssessResponse>("/eimm/assess", { domain: "dashboard_demo", criteria });
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? JSON.stringify(err.body) : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">EIMM Assessment</h1>
      <p className="page-subtitle">
        Emotional Infrastructure Maturity Model self-assessment. Levels 4 and 5 are aspirational
        maturity targets: no external certification authority reviews or endorses this result.
      </p>

      {error && <div className="error-block">{error}</div>}

      {levels && (
        <div className="card">
          <h2>Maturity levels -- GET /eimm/levels</h2>
          <table>
            <thead>
              <tr>
                <th>Level</th>
                <th>Name</th>
                <th>Description</th>
                <th>Aspirational</th>
              </tr>
            </thead>
            <tbody>
              {levels.levels.map((l) => (
                <tr key={l.level}>
                  <td>{l.level}</td>
                  <td>{l.name}</td>
                  <td>{l.description}</td>
                  <td>{l.aspirational_only ? "yes" : "no"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="page-subtitle" style={{ marginTop: 10 }}>{levels.claim_boundary_note}</p>
        </div>
      )}

      <form className="card" onSubmit={onSubmit}>
        <h2>Self-assessment -- POST /eimm/assess</h2>
        {CRITERIA_KEYS.map((key) => (
          <div className="form-row" key={key}>
            <label>
              <input
                type="checkbox"
                checked={criteria[key]}
                onChange={(e) => setCriteria((prev) => ({ ...prev, [key]: e.target.checked }))}
                style={{ width: "auto", marginRight: 8 }}
              />
              {key.replaceAll("_", " ")}
            </label>
          </div>
        ))}
        <button className="primary" type="submit" disabled={loading}>
          {loading ? "Assessing…" : "Run assessment"}
        </button>
      </form>

      {result && (
        <div className="card">
          <h2>Result</h2>
          <div style={{ marginBottom: 10 }}>
            Level {result.maturity_level}: {result.level_name}{" "}
            <StatusPill value={result.certification_body_exists ? "allow" : "review_required"} />
          </div>
          <JsonBlock data={result} />
        </div>
      )}
    </div>
  );
}
