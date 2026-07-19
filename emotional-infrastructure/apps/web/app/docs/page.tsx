"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

interface DocFile {
  name: string;
  content: string;
}

interface RootResponse {
  name: string;
  status: string;
  docs: string;
}

export default function DocsViewerPage() {
  const [docs, setDocs] = useState<DocFile[] | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiInfo, setApiInfo] = useState<RootResponse | null>(null);

  useEffect(() => {
    fetch("/api/docs")
      .then((r) => r.json())
      .then((body) => {
        setDocs(body.docs);
        if (body.docs?.length > 0) setActive(body.docs[0].name);
        if (body.error) setError(body.error);
      })
      .catch((err) => setError(String(err)));

    apiGet<RootResponse>("/").then(setApiInfo).catch(() => undefined);
  }, []);

  const activeDoc = docs?.find((d) => d.name === active);

  return (
    <div>
      <h1 className="page-title">Docs Viewer</h1>
      <p className="page-subtitle">
        Renders the repository&apos;s own <code>docs/*.md</code> files -- the same claim-disciplined
        documentation shipped in source control, not separate marketing copy.
      </p>

      {apiInfo && (
        <div className="claim-banner">
          Live API status (GET /): <strong>{apiInfo.status}</strong>
        </div>
      )}

      {error && <div className="error-block">{error}</div>}

      {docs && docs.length > 0 && (
        <div style={{ display: "flex", gap: 20 }}>
          <div className="card" style={{ width: 220, flexShrink: 0, height: "fit-content" }}>
            <h2>Files</h2>
            {docs.map((d) => (
              <div key={d.name} style={{ marginBottom: 4 }}>
                <button
                  className={active === d.name ? "primary" : "secondary"}
                  style={{ width: "100%", textAlign: "left", fontSize: 12 }}
                  onClick={() => setActive(d.name)}
                >
                  {d.name}
                </button>
              </div>
            ))}
          </div>
          <div className="card" style={{ flex: 1, minWidth: 0 }}>
            <h2>{activeDoc?.name}</h2>
            <pre className="json-block" style={{ whiteSpace: "pre-wrap" }}>{activeDoc?.content}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
