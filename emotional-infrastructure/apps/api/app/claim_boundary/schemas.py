from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class ClaimScanRequest(BaseModel):
    text: str = Field(min_length=1, max_length=20000)
    source_label: str = "unspecified"


class FlaggedTerm(BaseModel):
    term: str
    start: int
    end: int
    matched_text: str
    suggested_replacement: str


class ClaimScanResponse(BaseModel):
    passed: bool
    flagged_terms: list[FlaggedTerm]
    suggestions: list[str]
    scan_id: str


class ClaimRulesResponse(BaseModel):
    restricted_phrases: list[str]
    safe_replacements: list[str]
    replacement_map: dict[str, str]
