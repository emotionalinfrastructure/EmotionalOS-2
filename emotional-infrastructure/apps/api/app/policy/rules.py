"""Default Policy Engine rules and the condition-matching evaluator.

Conditions are a tiny, explicit predicate language (no eval/exec) so rules
loaded from the database are still safe to evaluate: each leaf checks one
field against an expected value or membership set, combined with "all" /
"any".
"""
from __future__ import annotations

from typing import Any

DEFAULT_RULES: list[dict[str, Any]] = [
    {
        "name": "deny_missing_or_invalid_consent",
        "description": "Deny protected processing without a valid CTP token.",
        "decision": "deny",
        "priority": 10,
        "condition": {"any": [{"field": "token_present", "equals": False}, {"field": "token_valid", "equals": False}]},
    },
    {
        "name": "deny_revoked_token",
        "description": "Deny processing when the presented CTP token has been revoked.",
        "decision": "deny",
        "priority": 15,
        "condition": {"field": "token_revoked", "equals": True},
    },
    {
        "name": "deny_context_mismatch",
        "description": "Deny processing when the submitted context envelope hash does not match the token.",
        "decision": "deny",
        "priority": 20,
        "condition": {"field": "context_match", "equals": False},
    },
    {
        "name": "deny_tier3_manipulation",
        "description": "Deny and flag any request associated with a Tier 3 manipulation-vector signal.",
        "decision": "deny",
        "priority": 25,
        "condition": {"field": "signal_tier", "equals": 3},
    },
    {
        "name": "require_step_up_tier2_irreversible",
        "description": "Require consent step-up for Tier 2 vulnerability markers plus a high-risk or irreversible action.",
        "decision": "review_required",
        "priority": 30,
        "condition": {
            "all": [
                {"field": "signal_tier", "equals": 2},
                {"field": "action_risk", "in": ["high", "irreversible"]},
                {"field": "step_up_confirmed", "equals": False},
            ]
        },
    },
    {
        "name": "require_tar_authorization",
        "description": "Require a live TAR authorization before acting on an inferred state.",
        "decision": "reauthorization_required",
        "priority": 35,
        "condition": {
            "all": [
                {"field": "acts_on_inferred_state", "equals": True},
                {"field": "tar_authorized", "equals": False},
            ]
        },
    },
    {
        "name": "require_trajectory_review_on_substitution_risk",
        "description": "Require human review when trajectory substitution risk is elevated.",
        "decision": "review_required",
        "priority": 40,
        "condition": {"field": "substitution_risk_elevated", "equals": True},
    },
    {
        "name": "deny_tier1_steering",
        "description": "Tier 1 operational-stress signals may adapt interface tempo only; using them for steering is denied.",
        "decision": "deny",
        "priority": 45,
        "condition": {"all": [{"field": "signal_tier", "equals": 1}, {"field": "is_steering", "equals": True}]},
    },
    {
        "name": "allow_tier0_ordinary_processing",
        "description": "Tier 0 basal-state signals are allowed for ordinary processing.",
        "decision": "allow",
        "priority": 90,
        "condition": {"field": "signal_tier", "equals": 0},
    },
    {
        "name": "allow_tier1_tempo_adaptation",
        "description": "Tier 1 signals are allowed for interface tempo adaptation only, never for steering.",
        "decision": "allow",
        "priority": 91,
        "condition": {"all": [{"field": "signal_tier", "equals": 1}, {"field": "is_steering", "equals": False}]},
    },
]

FALLBACK_DECISION = "review_required"


def matches(condition: dict[str, Any], context: dict[str, Any]) -> bool:
    if "all" in condition:
        return all(matches(sub, context) for sub in condition["all"])
    if "any" in condition:
        return any(matches(sub, context) for sub in condition["any"])

    field = condition["field"]
    value = context.get(field)

    if "equals" in condition:
        return value == condition["equals"]
    if "in" in condition:
        return value in condition["in"]
    return False
