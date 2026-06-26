// Ported from the EmotionalOS Swift console prototype
// (SignalProcessor.swift, ToneManager.swift, Analytics.swift).
// The prototype worked over raw -1..1 signal samples; this app stores
// valence on a -100..100 scale, so callers normalize with
// normalizeValence() before feeding values into the functions below.

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function normalizeValence(valence: number): number {
  return valence / 100;
}

export function interpretTone(normalizedAverage: number): string {
  if (normalizedAverage < -0.3) return "Calm / Grounded";
  if (normalizedAverage <= 0.3) return "Balanced";
  return "Elevated / Energized";
}

export function computeCoherence(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = average(values);
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  return Math.max(0, 1 - stdDev);
}

export type SessionTrend = "Falling / Calming" | "Stable" | "Rising / Energizing" | "Neutral";

export function computeSessionTrend(values: number[]): SessionTrend {
  if (values.length <= 1) return "Neutral";
  const diff = values[values.length - 1] - values[0];
  if (diff < -0.2) return "Falling / Calming";
  if (diff <= 0.2) return "Stable";
  return "Rising / Energizing";
}
