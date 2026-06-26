# Changelog

All notable changes to EIOS SDK will be documented here.

## [1.0.0] - 2024-11-29

### Added
- Initial release of EIOS SDK
- Complete Emotional Infrastructure Framework (6 sections)
- Emotional Signal Detection Engine (ESDE)
- Emotional Kernel with 6 routing modes
- Legal compliance framework
- User rights enforcement system
- Cultural adaptation with 6 profiles
- Violation detection and enforcement
- Consent management system
- Memory management (session + safety ledger)
- Metrics tracking (NAS, ∆A, REI, EVI, CIS)
- Drift monitoring
- Complete integration examples
- Documentation and quick start guide

### Framework Features
- Non-Amplification Score (NAS) calculation
- Agency Delta (∆A) tracking
- Rumination Entropy Index (REI) detection
- Emotional Volatility Index (EVI) measurement
- Consent Integrity Score (CIS) enforcement

### Governance
- Three-tier certification system
- ESC oversight structure
- Graduated penalty system
- Public failure ledger
- Cultural sovereignty protections

### Cultural Support
- Western Individualist profile
- East Asian Collectivist profile
- Latin American profile
- Middle Eastern profile
- South Asian profile
- African profile

## [1.0.1] - 2026-06-26

### Added
- SPEC-101 v1.0.1 core engine: `eios.core.estate` (EState/Turn/EmotionVector/Metrics
  data model), `eios.core.policy` (shared keyword/recovery-window policy bundle),
  `eios.core.router` (non-bypassable safety router with recovery windows),
  `eios.metrics.engine` (NAS/∆A/REI/EVI/CIS formula implementations),
  `eios.core.ledger` (hash-chained + Bloom-filtered SQLite audit ledger),
  `eios.core.engine.EIOSEngine` (turn orchestration, replacing the v1.0.0 stub),
  `eios.tools.esc_auditor` (ESC replay auditor), and `eios.tools.export_cli`
  (Ed25519-signed ledger export tool, plus `ops/gen_keys.py` for keypair generation).
- Full pytest suite (formulas, router recovery state machine, ledger/Bloom/auditor,
  signed export, end-to-end engine integration) at 100% branch coverage, enforced
  via `--cov-fail-under=100` in `pytest.ini`.
- Scoped CI workflow (`.github/workflows/eios-sdk-python-ci.yml`).

### Changed
- `EIOSEngine` (`eios.core.engine`) now implements the full SPEC-101 turn pipeline
  (Router -> Metrics -> Ledger -> Responder) instead of returning a canned response.

### Fixed
- `eios.tools.export_cli.load_signing_key` no longer strips raw key bytes before
  checking their length, which could corrupt a genuine 32-byte Ed25519 key whose
  first or last byte happened to equal a whitespace character.

### Notes
- SPEC-101's state diagram has no transition into SAFE_MODE. This release resolves
  that gap by recovering QUARANTINE through SAFE_MODE before CONTAINMENT and NORMAL
  (`eios/core/policy.py`), reusing the SAFE_MODE cadence for the QUARANTINE leg.

## [Unreleased]

### Planned
- Additional cultural profiles (10+ cultures)
- ESC API integration
- Real-time dashboard
- Advanced stress testing
- Clinical validation tools
- Performance optimizations
- Multi-language consent templates
