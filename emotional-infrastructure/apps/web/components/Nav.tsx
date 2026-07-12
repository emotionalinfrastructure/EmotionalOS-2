"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_SECTIONS: { label: string; items: { href: string; label: string }[] }[] = [
  {
    label: "Overview",
    items: [{ href: "/", label: "Dashboard" }],
  },
  {
    label: "Consent Token Protocol",
    items: [
      { href: "/ctp/issue", label: "Issue Token" },
      { href: "/ctp/validate", label: "Validate Token" },
      { href: "/ctp/revoke", label: "Revoke Token" },
      { href: "/ctp/process", label: "Consent-Gated Processing" },
    ],
  },
  {
    label: "Governance",
    items: [
      { href: "/pdev", label: "PDEV Evaluation" },
      { href: "/egl", label: "EGL Signal Tiers" },
      { href: "/tar", label: "TAR Authorization" },
      { href: "/trajectory", label: "Trajectory Governance" },
    ],
  },
  {
    label: "Records & Rules",
    items: [
      { href: "/ledger", label: "Dignity Ledger" },
      { href: "/policy", label: "Policy Rules" },
      { href: "/claim-boundary", label: "Claim Boundary Scanner" },
      { href: "/eimm", label: "EIMM Assessment" },
    ],
  },
  {
    label: "Reference",
    items: [{ href: "/docs", label: "Docs Viewer" }],
  },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-title">Emotional Infrastructure</div>
        <div className="sidebar-brand-sub">Governance Runtime -- candidate architecture / reference implementation</div>
      </div>
      {NAV_SECTIONS.map((section) => (
        <div key={section.label}>
          <div className="nav-group-label">{section.label}</div>
          {section.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={"nav-link" + (pathname === item.href ? " active" : "")}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
