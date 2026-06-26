// Ported from the EmotionalOS Swift console prototype
// (Report.swift, SessionLog.swift, SessionExporterJSON.swift), adapted to
// summarize real recorded EmotionalState entries instead of randomly
// generated signal batches.

import { type EmotionalState } from "@shared/schema";
import {
  average,
  computeCoherence,
  computeSessionTrend,
  interpretTone,
  normalizeValence,
  type SessionTrend,
} from "@shared/emotional-analytics";

export interface SessionReport {
  signals: number[];
  average: number;
  tone: string;
  coherence: number;
  trend: SessionTrend;
  sampleSize: number;
}

// `states` is expected newest-first, matching storage.getRecentEmotionalStates().
export function buildSessionReport(states: EmotionalState[]): SessionReport {
  const chronological = [...states].reverse();
  const signals = chronological.map((state) => normalizeValence(state.valence));
  const avg = average(signals);

  return {
    signals,
    average: avg,
    tone: interpretTone(avg),
    coherence: computeCoherence(signals),
    trend: computeSessionTrend(signals),
    sampleSize: signals.length,
  };
}

export interface ToneGroupSummary {
  tone: string;
  count: number;
  avgCoherence: number;
}

// Groups recorded states by their individual tone and reports how
// internally coherent each tone group's valence readings are.
export function summarizeByTone(states: EmotionalState[]): ToneGroupSummary[] {
  const groups = new Map<string, number[]>();

  for (const state of states) {
    const normalized = normalizeValence(state.valence);
    const tone = interpretTone(normalized);
    const values = groups.get(tone) ?? [];
    values.push(normalized);
    groups.set(tone, values);
  }

  return Array.from(groups.entries()).map(([tone, values]) => ({
    tone,
    count: values.length,
    avgCoherence: computeCoherence(values),
  }));
}
