import { RESTRICTED_CLAIM_PHRASES, SAFE_CLAIM_REPLACEMENTS } from "@emotional-infrastructure/shared-schemas";

export const RESTRICTED_PHRASE_REPLACEMENTS: Record<string, string> = {
  certified: "reference implementation",
  "regulator-approved": "candidate architecture (not yet regulator-reviewed)",
  "legally compliant": "designed to align with (not a legal-compliance claim)",
  "clinically validated": "developer prototype (not clinically validated)",
  "externally audited": "not yet externally audited",
  "production-ready": "developer prototype",
  "benchmark-proven": "validation-ready (no benchmark claims made)",
  "standards-body adopted": "proposed technical framework",
  "guaranteed compliant": "validation-ready (compliance not guaranteed)",
  "proven compliance": "candidate architecture (compliance not proven)",
};

export interface FlaggedTerm {
  term: string;
  start: number;
  end: number;
  matchedText: string;
  suggestedReplacement: string;
}

export interface ClaimScanResult {
  passed: boolean;
  flaggedTerms: FlaggedTerm[];
  suggestions: readonly string[];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Scans free text for restricted overclaiming language (mirrors
 * apps/api/app/claim_boundary/rules.py). Intended for pre-flighting
 * marketing copy, docs, or UI strings client-side before they are
 * published, in addition to the authoritative POST /claim-boundary/scan. */
export function scanClaimBoundary(text: string): ClaimScanResult {
  const flaggedTerms: FlaggedTerm[] = [];

  for (const phrase of RESTRICTED_CLAIM_PHRASES) {
    const pattern = new RegExp(escapeRegExp(phrase), "gi");
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      flaggedTerms.push({
        term: phrase,
        start: match.index,
        end: match.index + match[0].length,
        matchedText: match[0],
        suggestedReplacement: RESTRICTED_PHRASE_REPLACEMENTS[phrase],
      });
    }
  }

  flaggedTerms.sort((a, b) => a.start - b.start);

  return {
    passed: flaggedTerms.length === 0,
    flaggedTerms,
    suggestions: SAFE_CLAIM_REPLACEMENTS,
  };
}
