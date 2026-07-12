from __future__ import annotations

import re

from sqlalchemy.orm import Session

from app.claim_boundary.rules import RESTRICTED_PHRASE_REPLACEMENTS, RESTRICTED_PHRASES, SAFE_REPLACEMENTS
from app.claim_boundary.schemas import ClaimRulesResponse, ClaimScanRequest, ClaimScanResponse, FlaggedTerm
from app.models import ClaimBoundaryScan


def scan(db: Session, req: ClaimScanRequest) -> ClaimScanResponse:
    flagged: list[FlaggedTerm] = []
    for phrase in RESTRICTED_PHRASES:
        pattern = re.compile(re.escape(phrase), re.IGNORECASE)
        for match in pattern.finditer(req.text):
            flagged.append(
                FlaggedTerm(
                    term=phrase,
                    start=match.start(),
                    end=match.end(),
                    matched_text=match.group(0),
                    suggested_replacement=RESTRICTED_PHRASE_REPLACEMENTS[phrase],
                )
            )

    flagged.sort(key=lambda f: f.start)
    passed = len(flagged) == 0

    row = ClaimBoundaryScan(
        source_label=req.source_label,
        input_text=req.text,
        flagged_terms=[f.model_dump() for f in flagged],
        suggestions=SAFE_REPLACEMENTS,
        passed=passed,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    return ClaimScanResponse(passed=passed, flagged_terms=flagged, suggestions=SAFE_REPLACEMENTS, scan_id=row.id)


def get_rules() -> ClaimRulesResponse:
    return ClaimRulesResponse(
        restricted_phrases=RESTRICTED_PHRASES,
        safe_replacements=SAFE_REPLACEMENTS,
        replacement_map=RESTRICTED_PHRASE_REPLACEMENTS,
    )
