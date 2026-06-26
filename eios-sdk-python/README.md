# EIOS SDK - Emotional Infrastructure Operating System

**Version:** 1.0.1  
**License:** Emotional Safety Public License (ESPL)  
**Status:** Production Ready

> **v1.0.1**: `EIOSEngine` now runs the full SPEC-101 core engine (router with
> recovery windows, NAS/∆A/REI/EVI/CIS metrics, hash-chained + Bloom-filtered
> ledger, ESC replay auditor, Ed25519-signed exports) instead of the v1.0.0
> placeholder. See `CHANGELOG.md` for details.

Protect users' nervous systems in AI interactions through mathematically-enforced emotional safety.

## What is EIOS?

EIOS is a safety layer that sits between users and AI systems, automatically:

✓ **Detecting emotional state** (intensity, agency, rumination, volatility)  
✓ **Routing conversations** based on risk (NORMAL → CONTAINMENT → SAFE_MODE → QUARANTINE)  
✓ **Enforcing consent** before exploring trauma or deep emotional topics  
✓ **Preventing amplification** of distress (mathematically proven via NAS)  
✓ **Preserving agency** (doesn't erode user's sense of capability)  
✓ **Adapting to culture** (calibrates metrics for cultural context)  
✓ **Protecting sovereignty** (doesn't impose Western norms globally)  
✓ **Enforcing user rights** (transparency, audit, data privacy)  
✓ **Detecting violations** (monitors system for safety failures)

## Installation

```bash
pip install eios-sdk
```

Or from source:

```bash
git clone https://github.com/eios/sdk
cd sdk
pip install -e .
```

## Quick Start (5 Minutes)

```python
from eios import EIOSEngine

# 1. Initialize EIOS
eios = EIOSEngine(
    system_id="my_chatbot",
    certification_tier="Tier2",
    jurisdiction="international"
)

# 2. Process user messages through EIOS
result = eios.process_interaction(
    session_id="conv_123",
    user_text="I'm feeling anxious about work",
)

# 3. Use the EIOS-protected response
print(result['response'])
print(f"Route: {result['route']}")
print(f"Safety metrics: NAS={result['metrics']['NAS']:.2f}")
```

## Core Metrics

- **NAS (Non-Amplification Score)**: System reduces or maintains distress (target: >0.8)
- **∆A (Agency Delta)**: User’s sense of capability increases (target: ≥0)
- **REI (Rumination Entropy Index)**: Thought patterns remain flexible (target: >2.0)
- **EVI (Emotional Volatility Index)**: Emotional stability maintained (target: <2.5)
- **CIS (Consent Integrity Score)**: Consent properly obtained (target: >0.95)

## Routing Modes

- **NORMAL**: Full depth available, user is stable
- **CONTAINMENT**: Reduced depth, gentle grounding, agency reinforcement
- **SAFE_MODE**: Minimal depth, stabilization focus only
- **CONSENT_GATE**: Waiting for explicit permission before depth
- **QUARANTINE**: Crisis detected, emergency resources provided

## Certification Tiers

**Tier 1**: Basic emotional interaction (customer service)

- Requirements: NAS > 0.8
- Recertification: Annual

**Tier 2**: Moderate emotional depth (companions, coaching)

- Requirements: NAS > 0.85, ∆A > -0.05, CIS > 0.95
- Recertification: Quarterly

**Tier 3**: High emotional risk (mental health)

- Requirements: NAS > 0.9, ∆A > 0, CIS > 0.98
- Recertification: Monthly

## Cultural Support

Built-in profiles for:

- Western Individualist (English, German, Dutch, Swedish)
- East Asian Collectivist (Chinese, Japanese, Korean)
- Latin American (Spanish, Portuguese)
- Middle Eastern (Arabic, Farsi, Turkish)
- South Asian (Hindi, Urdu, Bengali, Tamil)
- African (Swahili, Hausa, Yoruba, Zulu)

## Documentation

- **Framework**: See `docs/framework/` for complete theoretical foundation
- **API Reference**: See `docs/api/` for detailed API documentation
- **Examples**: See `examples/` for integration patterns
- **Online**: <https://docs.eios.global>

## Project Structure

```text
eios-sdk/
├── README.md
├── setup.py
├── requirements.txt
├── LICENSE
├── docs/
│   ├── framework/           # Complete framework documentation
│   └── api/                 # API reference
├── eios/
│   ├── __init__.py
│   ├── core/
│   │   ├── eios_engine.py
│   │   ├── e_state.py
│   │   └── config.py
│   ├── detection/
│   │   ├── esde.py
│   │   ├── intensity_analyzer.py
│   │   ├── agency_analyzer.py
│   │   ├── rumination_detector.py
│   │   ├── volatility_calculator.py
│   │   └── trauma_screener.py
│   ├── routing/
│   │   ├── kernel.py
│   │   ├── routes.py
│   │   └── constraints.py
│   ├── consent/
│   │   ├── consent_manager.py
│   │   ├── consent_parser.py
│   │   ├── consent_ledger.py
│   │   └── revocation_detector.py
│   ├── enforcement/
│   │   ├── legal_framework.py
│   │   ├── liability_assessor.py
│   │   ├── user_rights.py
│   │   ├── violation_handler.py
│   │   └── penalty_calculator.py
│   ├── cultural/
│   │   ├── cultural_adapter.py
│   │   ├── cultural_profiles.py
│   │   ├── language_detector.py
│   │   └── sovereignty_protector.py
│   ├── memory/
│   │   ├── memory_manager.py
│   │   ├── session_memory.py
│   │   ├── safety_ledger.py
│   │   └── identity_blocker.py
│   ├── monitoring/
│   │   ├── drift_monitor.py
│   │   ├── metrics_tracker.py
│   │   ├── failure_logger.py
│   │   └── esc_reporter.py
│   ├── testing/
│   │   ├── stress_tester.py
│   │   ├── synthetic_scenarios.py
│   │   └── certification_validator.py
│   └── utils/
│       ├── crypto.py
│       ├── hashing.py
│       └── validators.py
├── examples/
│   ├── complete_integration.py
│   ├── mental_health_chatbot.py
│   ├── companion_app.py
│   ├── customer_service.py
│   └── multilingual_support.py
└── tests/
    ├── test_esde.py
    ├── test_kernel.py
    ├── test_consent.py
    ├── test_cultural.py
    └── test_violations.py
```

## Support

- **Email**: [email protected]
- **GitHub Issues**: <https://github.com/eios/sdk/issues>
- **Documentation**: <https://docs.eios.global>
- **ESC Portal**: <https://esc.global>

## Citation

```bibtex
@software{eios2024,
  title={EIOS: Emotional Infrastructure Operating System},
  author={Emotional Safety Commission},
  year={2024},
  url={https://github.com/eios/sdk}
}
```

## License

EIOS SDK is licensed under the Emotional Safety Public License (ESPL).

---

**Protecting human nervous systems in AI interactions.**
