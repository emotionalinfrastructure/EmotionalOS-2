export interface SignalFeatures {
  urgencyScore?: number;
  repetitionScore?: number;
  pacingScore?: number;
  exhaustionScore?: number;
  confusionScore?: number;
  epistemicSurrenderScore?: number;
  profilingVectorScore?: number;
  attachmentBuildingScore?: number;
  insecurityExploitationScore?: number;
}

export interface SignalTierResult {
  tier: 0 | 1 | 2 | 3;
  tierLabel: string;
  signalCodes: string[];
}

const TIER_LABELS = ["basal_state", "operational_stress", "vulnerability_markers", "manipulation_vectors"] as const;

const TIER3_THRESHOLD = 0.5;
const TIER2_THRESHOLD = 0.5;
const TIER1_THRESHOLD = 0.4;

/** Maps pre-computed, non-content behavioral signal magnitudes (0-1) to a
 * governance risk tier. Mirrors apps/api/app/egl/service.py::classify_signal
 * exactly (same thresholds) so client-side pre-checks agree with the
 * server's POST /egl/classify-signal. Never inspects raw message content. */
export function classifySignalTier(features: SignalFeatures): SignalTierResult {
  const tier3: Record<string, number> = {
    profiling_vector_score: features.profilingVectorScore ?? 0,
    attachment_building_score: features.attachmentBuildingScore ?? 0,
    insecurity_exploitation_score: features.insecurityExploitationScore ?? 0,
  };
  const tier2: Record<string, number> = {
    exhaustion_score: features.exhaustionScore ?? 0,
    confusion_score: features.confusionScore ?? 0,
    epistemic_surrender_score: features.epistemicSurrenderScore ?? 0,
  };
  const tier1: Record<string, number> = {
    urgency_score: features.urgencyScore ?? 0,
    repetition_score: features.repetitionScore ?? 0,
    pacing_score: features.pacingScore ?? 0,
  };

  const tier3Hits = Object.entries(tier3).filter(([, v]) => v >= TIER3_THRESHOLD).map(([k]) => k);
  const tier2Hits = Object.entries(tier2).filter(([, v]) => v >= TIER2_THRESHOLD).map(([k]) => k);
  const tier1Hits = Object.entries(tier1).filter(([, v]) => v >= TIER1_THRESHOLD).map(([k]) => k);

  let tier: 0 | 1 | 2 | 3;
  let signalCodes: string[];

  if (tier3Hits.length > 0) {
    tier = 3;
    signalCodes = tier3Hits;
  } else if (tier2Hits.length > 0) {
    tier = 2;
    signalCodes = tier2Hits;
  } else if (tier1Hits.length > 0) {
    tier = 1;
    signalCodes = tier1Hits;
  } else {
    tier = 0;
    signalCodes = [];
  }

  return { tier, tierLabel: TIER_LABELS[tier], signalCodes };
}
