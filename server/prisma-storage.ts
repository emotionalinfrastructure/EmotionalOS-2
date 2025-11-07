import {
  type EmotionalState,
  type InsertEmotionalState,
  type NssiEvent,
  type InsertNssiEvent,
  type SessionLog,
  type InsertSessionLog,
  type VaultEntry,
  type InsertVaultEntry,
  type AnalyticsPattern,
  type InsertAnalyticsPattern,
  type UserSettings,
  type InsertUserSettings,
  type EnrichedVaultEntry,
} from "@shared/schema";
import { db } from "./db";
import { createHash } from "crypto";
import type { IStorage } from "./storage";
import type { 
  EmotionalState as PrismaEmotionalState,
  NssiEvent as PrismaNssiEvent,
  SessionLog as PrismaSessionLog,
  VaultEntry as PrismaVaultEntry,
  AnalyticsPattern as PrismaAnalyticsPattern
} from ".prisma/client";

export class PrismaStorage implements IStorage {
  private async getUserId(): Promise<string> {
    const user = await db.user.findFirst({ 
      where: { email: "local@emotional.os" } 
    });
    if (!user) {
      throw new Error("Default user not found. Run seed script first.");
    }
    return user.id;
  }

  private generateHash(data: string): string {
    return createHash("sha256").update(data).digest("hex");
  }

  private parseWaveform(waveform: string | null): number[] | null {
    if (!waveform) return null;
    try {
      const parsed = JSON.parse(waveform);
      return Array.isArray(parsed) ? (parsed as number[]) : null;
    } catch {
      return null;
    }
  }

  // Emotional States
  async getEmotionalStates(limit?: number): Promise<EmotionalState[]> {
    const userId = await this.getUserId();
    const states = await db.emotionalState.findMany({
      where: { userId },
      orderBy: { recordedAt: "desc" },
      take: limit,
    });

    return states.map((state: PrismaEmotionalState): EmotionalState => ({
      id: state.id,
      timestamp: state.recordedAt,
      intensity: state.intensity,
      valence: state.valence,
      arousal: state.arousal,
      note: null,
      waveformData: this.parseWaveform(state.waveform),
    }));
  }

  async getEmotionalStatesByDateRange(days: number): Promise<EmotionalState[]> {
    const userId = await this.getUserId();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const states = await db.emotionalState.findMany({
      where: {
        userId,
        recordedAt: { gte: cutoff },
      },
      orderBy: { recordedAt: "desc" },
    });

    return states.map((state: PrismaEmotionalState): EmotionalState => ({
      id: state.id,
      timestamp: state.recordedAt,
      intensity: state.intensity,
      valence: state.valence,
      arousal: state.arousal,
      note: null,
      waveformData: this.parseWaveform(state.waveform),
    }));
  }

  async getRecentEmotionalStates(limit: number): Promise<EmotionalState[]> {
    return this.getEmotionalStates(limit);
  }

  async createEmotionalState(
    insertState: InsertEmotionalState,
  ): Promise<EmotionalState> {
    const userId = await this.getUserId();
    
    const state = await db.emotionalState.create({
      data: {
        userId,
        intensity: insertState.intensity,
        valence: insertState.valence,
        arousal: insertState.arousal,
        waveform: insertState.waveformData ? JSON.stringify(insertState.waveformData) : null,
        tags: JSON.stringify([]),
      },
    });

    const lastVault = await db.vaultEntry.findFirst({
      where: { userId },
      orderBy: { chainIndex: "desc" },
    });

    const vaultData = {
      userId,
      kind: "state",
      payload: { id: state.id, valence: state.valence, arousal: state.arousal },
      prevHash: lastVault?.sha256 ?? null,
      chainIndex: (lastVault?.chainIndex ?? -1) + 1,
    };
    
    const hash = this.generateHash(JSON.stringify(vaultData));
    
    await db.vaultEntry.create({
      data: {
        userId,
        kind: "state",
        payload: JSON.stringify(vaultData.payload),
        prevHash: lastVault?.sha256,
        chainIndex: vaultData.chainIndex,
        sha256: hash,
      },
    });

    return {
      id: state.id,
      timestamp: state.recordedAt,
      intensity: state.intensity,
      valence: state.valence,
      arousal: state.arousal,
      note: null,
      waveformData: insertState.waveformData ? (insertState.waveformData as number[]) : null,
    };
  }

  // NSSI Events
  async getNssiEvents(limit?: number): Promise<NssiEvent[]> {
    const userId = await this.getUserId();
    const events = await db.nssiEvent.findMany({
      where: { userId },
      orderBy: { occurredAt: "desc" },
      take: limit,
    });

    return events.map((event: PrismaNssiEvent): NssiEvent => ({
      id: event.id,
      timestamp: event.occurredAt,
      severity: event.severity,
      triggerType: event.triggerType,
      interventionUsed: event.intervention,
      note: event.notes,
      emotionalStateId: null,
    }));
  }

  async getNssiEventsByDateRange(days: number): Promise<NssiEvent[]> {
    const userId = await this.getUserId();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const events = await db.nssiEvent.findMany({
      where: {
        userId,
        occurredAt: { gte: cutoff },
      },
      orderBy: { occurredAt: "desc" },
    });

    return events.map((event: PrismaNssiEvent): NssiEvent => ({
      id: event.id,
      timestamp: event.occurredAt,
      severity: event.severity,
      triggerType: event.triggerType,
      interventionUsed: event.intervention,
      note: event.notes,
      emotionalStateId: null,
    }));
  }

  async getRecentNssiEvents(limit: number): Promise<NssiEvent[]> {
    return this.getNssiEvents(limit);
  }

  async createNssiEvent(insertEvent: InsertNssiEvent): Promise<NssiEvent> {
    const userId = await this.getUserId();
    
    const event = await db.nssiEvent.create({
      data: {
        userId,
        severity: insertEvent.severity,
        triggerType: insertEvent.triggerType ?? null,
        intervention: insertEvent.interventionUsed ?? null,
        notes: insertEvent.note ?? null,
      },
    });

    const lastVault = await db.vaultEntry.findFirst({
      where: { userId },
      orderBy: { chainIndex: "desc" },
    });

    const vaultData = {
      userId,
      kind: "nssi",
      payload: { id: event.id, severity: event.severity },
      prevHash: lastVault?.sha256 ?? null,
      chainIndex: (lastVault?.chainIndex ?? -1) + 1,
    };
    
    const hash = this.generateHash(JSON.stringify(vaultData));
    
    await db.vaultEntry.create({
      data: {
        userId,
        kind: "nssi",
        payload: JSON.stringify(vaultData.payload),
        prevHash: lastVault?.sha256,
        chainIndex: vaultData.chainIndex,
        sha256: hash,
      },
    });

    return {
      id: event.id,
      timestamp: event.occurredAt,
      severity: event.severity,
      triggerType: event.triggerType,
      interventionUsed: event.intervention,
      note: event.notes,
      emotionalStateId: null,
    };
  }

  // Session Logs
  async getSessionLogs(): Promise<SessionLog[]> {
    const userId = await this.getUserId();
    const logs = await db.sessionLog.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
    });

    return logs.map((log: PrismaSessionLog): SessionLog => ({
      id: log.id,
      startTime: log.startedAt,
      endTime: log.endedAt ?? null,
      duration: log.durationSec ?? null,
      avgIntensity: null,
      peakIntensity: null,
      emotionalStateIds: null,
      sessionType: null,
      metadata: null,
    }));
  }

  async createSessionLog(insertLog: InsertSessionLog): Promise<SessionLog> {
    const userId = await this.getUserId();
    
    const log = await db.sessionLog.create({
      data: {
        userId,
        startedAt: insertLog.startTime ?? new Date(),
        endedAt: insertLog.endTime ?? null,
        durationSec: insertLog.duration ?? null,
        note: null,
      },
    });

    return {
      id: log.id,
      startTime: log.startedAt,
      endTime: log.endedAt ?? null,
      duration: log.durationSec ?? null,
      avgIntensity: insertLog.avgIntensity !== undefined ? insertLog.avgIntensity : null,
      peakIntensity: insertLog.peakIntensity !== undefined ? insertLog.peakIntensity : null,
      emotionalStateIds: insertLog.emotionalStateIds ? (insertLog.emotionalStateIds as string[]) : null,
      sessionType: insertLog.sessionType ?? null,
      metadata: insertLog.metadata ?? null,
    };
  }

  // Vault Entries
  async getVaultEntries(): Promise<EnrichedVaultEntry[]> {
    const userId = await this.getUserId();
    const entries = await db.vaultEntry.findMany({
      where: { userId },
      orderBy: { chainIndex: "asc" },
    });

    return Promise.all(
      entries.map(async (entry: PrismaVaultEntry): Promise<EnrichedVaultEntry> => {
        let contentSummary = null;
        const payload = JSON.parse(entry.payload);

        if (entry.kind === "state" && payload.id) {
          const state = await db.emotionalState.findUnique({
            where: { id: payload.id },
          });
          if (state) {
            contentSummary = {
              intensity: state.intensity,
              valence: state.valence,
              arousal: state.arousal,
              note: null,
            };
          }
        } else if (entry.kind === "nssi" && payload.id) {
          const event = await db.nssiEvent.findUnique({
            where: { id: payload.id },
          });
          if (event) {
            contentSummary = {
              severity: event.severity,
              triggerType: event.triggerType,
            };
          }
        }

        return {
          id: entry.id,
          timestamp: entry.createdAt,
          dataHash: entry.sha256,
          entryType: entry.kind,
          referenceId: payload.id || "",
          encryptionStatus: "encrypted",
          previousHash: entry.prevHash,
          contentSummary,
        };
      })
    );
  }

  async createVaultEntry(insertEntry: InsertVaultEntry): Promise<VaultEntry> {
    const userId = await this.getUserId();
    
    // Get last vault entry to derive chain index and previous hash
    const lastVault = await db.vaultEntry.findFirst({
      where: { userId },
      orderBy: { chainIndex: "desc" },
    });

    const chainIndex = (lastVault?.chainIndex ?? -1) + 1;
    const prevHash = lastVault?.sha256 ?? null;
    
    const entry = await db.vaultEntry.create({
      data: {
        userId,
        kind: insertEntry.entryType,
        payload: JSON.stringify({ referenceId: insertEntry.referenceId }),
        sha256: insertEntry.dataHash,
        prevHash,
        chainIndex,
      },
    });

    return {
      id: entry.id,
      timestamp: entry.createdAt,
      dataHash: entry.sha256,
      entryType: entry.kind,
      referenceId: insertEntry.referenceId,
      encryptionStatus: "encrypted",
      previousHash: entry.prevHash,
    };
  }

  async getLastVaultHash(): Promise<string | null> {
    const userId = await this.getUserId();
    const lastEntry = await db.vaultEntry.findFirst({
      where: { userId },
      orderBy: { chainIndex: "desc" },
    });
    return lastEntry?.sha256 ?? null;
  }

  // Analytics Patterns
  async getAnalyticsPatterns(): Promise<AnalyticsPattern[]> {
    const userId = await this.getUserId();
    const patterns = await db.analyticsPattern.findMany({
      where: { userId },
      orderBy: { detectedAt: "desc" },
    });

    return patterns.map((pattern: PrismaAnalyticsPattern): AnalyticsPattern => ({
      id: pattern.id,
      detectedAt: pattern.detectedAt,
      patternType: pattern.name,
      description: pattern.description ?? "",
      confidence: null,
      dataPoints: null,
      recommendation: pattern.description,
    }));
  }

  async createAnalyticsPattern(
    pattern: InsertAnalyticsPattern,
  ): Promise<AnalyticsPattern> {
    const userId = await this.getUserId();
    
    const created = await db.analyticsPattern.create({
      data: {
        userId,
        name: pattern.patternType,
        description: pattern.description ?? null,
        params: JSON.stringify({}),
      },
    });

    return {
      id: created.id,
      detectedAt: created.detectedAt,
      patternType: created.name,
      description: created.description ?? "",
      confidence: pattern.confidence !== undefined ? pattern.confidence : null,
      dataPoints: pattern.dataPoints ? (pattern.dataPoints as number[]) : null,
      recommendation: pattern.recommendation !== undefined ? pattern.recommendation : null,
    };
  }

  // User Settings
  async getUserSettings(): Promise<UserSettings | undefined> {
    const userId = await this.getUserId();
    const settings = await db.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) return undefined;

    return {
      id: settings.id,
      userId: settings.userId,
      dataRetentionDays: settings.dataRetentionDays,
      enableHapticFeedback: true,
      enableAnalytics: true,
      privacyMode: settings.privacyMode,
      exportFormat: settings.exportFormat,
      theme: settings.theme,
    };
  }

  async updateUserSettings(
    updates: Partial<InsertUserSettings>,
  ): Promise<UserSettings> {
    const userId = await this.getUserId();
    
    const updated = await db.userSettings.update({
      where: { userId },
      data: {
        ...(updates.theme && { theme: updates.theme }),
        ...(updates.privacyMode !== undefined && { privacyMode: updates.privacyMode }),
        ...(updates.dataRetentionDays !== undefined && { dataRetentionDays: updates.dataRetentionDays }),
        ...(updates.exportFormat && { exportFormat: updates.exportFormat }),
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      dataRetentionDays: updated.dataRetentionDays,
      enableHapticFeedback: true,
      enableAnalytics: true,
      privacyMode: updated.privacyMode,
      exportFormat: updated.exportFormat,
      theme: updated.theme,
    };
  }

  // Stats & Analytics
  async getTodayStats(): Promise<{
    avgIntensity: number;
    peakIntensity: number;
    stateCount: number;
    nssiCount: number;
  }> {
    const userId = await this.getUserId();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const states = await db.emotionalState.findMany({
      where: {
        userId,
        recordedAt: { gte: today },
      },
    });

    const events = await db.nssiEvent.findMany({
      where: {
        userId,
        occurredAt: { gte: today },
      },
    });

    const intensities = states.map((s: PrismaEmotionalState) => s.intensity);
    const avgIntensity =
      intensities.length > 0
        ? intensities.reduce((a: number, b: number) => a + b, 0) / intensities.length
        : 0;
    const peakIntensity = intensities.length > 0 ? Math.max(...intensities) : 0;

    return {
      avgIntensity,
      peakIntensity,
      stateCount: states.length,
      nssiCount: events.length,
    };
  }

  async getAnalyticsSummary(): Promise<{
    avgIntensity: number;
    trendDirection: "up" | "down" | "stable";
    totalStates: number;
    totalNssiEvents: number;
    weeklyAverage: { day: string; avg: number }[];
  }> {
    const userId = await this.getUserId();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const states = await db.emotionalState.findMany({
      where: {
        userId,
        recordedAt: { gte: weekAgo },
      },
    });

    const events = await db.nssiEvent.findMany({
      where: { userId },
    });

    const intensities = states.map((s: PrismaEmotionalState) => s.intensity);
    const avgIntensity =
      intensities.length > 0
        ? intensities.reduce((a: number, b: number) => a + b, 0) / intensities.length
        : 0;

    const weeklyAverage = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const dayStates = states.filter(
        (state: PrismaEmotionalState) => state.recordedAt >= dayStart && state.recordedAt <= dayEnd
      );
      const dayIntensities = dayStates.map((state: PrismaEmotionalState) => state.intensity);
      const avg =
        dayIntensities.length > 0
          ? dayIntensities.reduce((a: number, b: number) => a + b, 0) / dayIntensities.length
          : 0;

      weeklyAverage.push({
        day: day.toISOString().split("T")[0],
        avg,
      });
    }

    return {
      avgIntensity,
      trendDirection: "stable",
      totalStates: states.length,
      totalNssiEvents: events.length,
      weeklyAverage,
    };
  }

  async getVaultStatus(): Promise<{
    totalEntries: number;
    encryptedEntries: number;
    lastHash: string;
    chainIntegrity: boolean;
  }> {
    const userId = await this.getUserId();
    const entries = await db.vaultEntry.findMany({
      where: { userId },
      orderBy: { chainIndex: "asc" },
    });

    let chainIntegrity = true;
    let prevHash: string | null = null;

    for (const entry of entries) {
      const vaultData = {
        userId,
        kind: entry.kind,
        payload: JSON.parse(entry.payload),
        prevHash,
        chainIndex: entry.chainIndex,
      };
      const hash = this.generateHash(JSON.stringify(vaultData));
      
      if (hash !== entry.sha256) {
        chainIntegrity = false;
        break;
      }
      prevHash = entry.sha256;
    }

    return {
      totalEntries: entries.length,
      encryptedEntries: entries.length,
      lastHash: entries[entries.length - 1]?.sha256 ?? "",
      chainIntegrity,
    };
  }

  // Data Management
  async deleteAllData(): Promise<void> {
    const userId = await this.getUserId();
    
    await db.vaultEntry.deleteMany({ where: { userId } });
    await db.analyticsPattern.deleteMany({ where: { userId } });
    await db.nssiEvent.deleteMany({ where: { userId } });
    await db.emotionalState.deleteMany({ where: { userId } });
    await db.sessionLog.deleteMany({ where: { userId } });
  }
}

export const prismaStorage = new PrismaStorage();
