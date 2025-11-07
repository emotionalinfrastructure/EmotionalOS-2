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
import { randomUUID } from "crypto";
import { createHash } from "crypto";

export interface IStorage {
  // Emotional States
  getEmotionalStates(limit?: number): Promise<EmotionalState[]>;
  getEmotionalStatesByDateRange(days: number): Promise<EmotionalState[]>;
  getRecentEmotionalStates(limit: number): Promise<EmotionalState[]>;
  createEmotionalState(state: InsertEmotionalState): Promise<EmotionalState>;

  // NSSI Events
  getNssiEvents(limit?: number): Promise<NssiEvent[]>;
  getNssiEventsByDateRange(days: number): Promise<NssiEvent[]>;
  getRecentNssiEvents(limit: number): Promise<NssiEvent[]>;
  createNssiEvent(event: InsertNssiEvent): Promise<NssiEvent>;

  // Session Logs
  getSessionLogs(): Promise<SessionLog[]>;
  createSessionLog(log: InsertSessionLog): Promise<SessionLog>;

  // Vault Entries
  getVaultEntries(): Promise<EnrichedVaultEntry[]>;
  createVaultEntry(entry: InsertVaultEntry): Promise<VaultEntry>;
  getLastVaultHash(): Promise<string | null>;

  // Analytics Patterns
  getAnalyticsPatterns(): Promise<AnalyticsPattern[]>;
  createAnalyticsPattern(
    pattern: InsertAnalyticsPattern,
  ): Promise<AnalyticsPattern>;

  // User Settings
  getUserSettings(): Promise<UserSettings | undefined>;
  updateUserSettings(
    settings: Partial<InsertUserSettings>,
  ): Promise<UserSettings>;

  // Stats & Analytics
  getTodayStats(): Promise<{
    avgIntensity: number;
    peakIntensity: number;
    stateCount: number;
    nssiCount: number;
  }>;
  getAnalyticsSummary(): Promise<{
    avgIntensity: number;
    trendDirection: "up" | "down" | "stable";
    totalStates: number;
    totalNssiEvents: number;
    weeklyAverage: { day: string; avg: number }[];
  }>;
  getVaultStatus(): Promise<{
    totalEntries: number;
    encryptedEntries: number;
    lastHash: string;
    chainIntegrity: boolean;
  }>;

  // Data Management
  deleteAllData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private emotionalStates: Map<string, EmotionalState>;
  private nssiEvents: Map<string, NssiEvent>;
  private sessionLogs: Map<string, SessionLog>;
  private vaultEntries: Map<string, VaultEntry>;
  private analyticsPatterns: Map<string, AnalyticsPattern>;
  private settings: UserSettings | undefined;

  constructor() {
    this.emotionalStates = new Map();
    this.nssiEvents = new Map();
    this.sessionLogs = new Map();
    this.vaultEntries = new Map();
    this.analyticsPatterns = new Map();
  }

  // Emotional States
  async getEmotionalStates(limit?: number): Promise<EmotionalState[]> {
    const states = Array.from(this.emotionalStates.values()).sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    return limit ? states.slice(0, limit) : states;
  }

  async getEmotionalStatesByDateRange(days: number): Promise<EmotionalState[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return Array.from(this.emotionalStates.values())
      .filter((state) => new Date(state.timestamp) >= cutoff)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
  }

  async getRecentEmotionalStates(limit: number): Promise<EmotionalState[]> {
    return this.getEmotionalStates(limit);
  }

  async createEmotionalState(
    insertState: InsertEmotionalState,
  ): Promise<EmotionalState> {
    const id = randomUUID();
    const state: EmotionalState = {
      ...insertState,
      id,
      timestamp: new Date(),
    } as EmotionalState;
    this.emotionalStates.set(id, state);

    // Create vault entry
    await this.createVaultEntry({
      dataHash: this.generateHash(JSON.stringify(state)),
      entryType: "emotional_state",
      referenceId: id,
      encryptionStatus: "encrypted",
      previousHash: await this.getLastVaultHash(),
    });

    return state;
  }

  // NSSI Events
  async getNssiEvents(limit?: number): Promise<NssiEvent[]> {
    const events = Array.from(this.nssiEvents.values()).sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    return limit ? events.slice(0, limit) : events;
  }

  async getNssiEventsByDateRange(days: number): Promise<NssiEvent[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return Array.from(this.nssiEvents.values())
      .filter((event) => new Date(event.timestamp) >= cutoff)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
  }

  async getRecentNssiEvents(limit: number): Promise<NssiEvent[]> {
    return this.getNssiEvents(limit);
  }

  async createNssiEvent(insertEvent: InsertNssiEvent): Promise<NssiEvent> {
    const id = randomUUID();
    const event: NssiEvent = {
      ...insertEvent,
      id,
      timestamp: new Date(),
    } as NssiEvent;
    this.nssiEvents.set(id, event);

    // Create vault entry
    await this.createVaultEntry({
      dataHash: this.generateHash(JSON.stringify(event)),
      entryType: "nssi_event",
      referenceId: id,
      encryptionStatus: "encrypted",
      previousHash: await this.getLastVaultHash(),
    });

    return event;
  }

  // Session Logs
  async getSessionLogs(): Promise<SessionLog[]> {
    return Array.from(this.sessionLogs.values()).sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );
  }

  async createSessionLog(insertLog: InsertSessionLog): Promise<SessionLog> {
    const id = randomUUID();
    const log: SessionLog = {
      ...insertLog,
      id,
    } as SessionLog;
    this.sessionLogs.set(id, log);
    return log;
  }

  // Vault Entries
  async getVaultEntries(): Promise<EnrichedVaultEntry[]> {
    const entries = Array.from(this.vaultEntries.values()).sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // Enrich entries with content from referenced records
    return entries.map((entry) => {
      let contentSummary = null;

      if (entry.entryType === "emotional_state") {
        const state = this.emotionalStates.get(entry.referenceId);
        if (state) {
          contentSummary = {
            intensity: state.intensity,
            valence: state.valence,
            arousal: state.arousal,
            note: state.note,
          };
        }
      } else if (entry.entryType === "nssi_event") {
        const event = this.nssiEvents.get(entry.referenceId);
        if (event) {
          contentSummary = {
            severity: event.severity,
            triggerType: event.triggerType,
            note: event.note,
          };
        }
      }

      return {
        ...entry,
        contentSummary,
      };
    });
  }

  async createVaultEntry(insertEntry: InsertVaultEntry): Promise<VaultEntry> {
    const id = randomUUID();
    const entry: VaultEntry = {
      ...insertEntry,
      id,
      timestamp: new Date(),
    } as VaultEntry;
    this.vaultEntries.set(id, entry);
    return entry;
  }

  async getLastVaultHash(): Promise<string | null> {
    const entries = Array.from(this.vaultEntries.values()).sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    return entries[0]?.dataHash || null;
  }

  // Analytics Patterns
  async getAnalyticsPatterns(): Promise<AnalyticsPattern[]> {
    return Array.from(this.analyticsPatterns.values()).sort(
      (a, b) =>
        new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime(),
    );
  }

  async createAnalyticsPattern(
    insertPattern: InsertAnalyticsPattern,
  ): Promise<AnalyticsPattern> {
    const id = randomUUID();
    const pattern: AnalyticsPattern = {
      ...insertPattern,
      id,
      detectedAt: new Date(),
    } as AnalyticsPattern;
    this.analyticsPatterns.set(id, pattern);
    return pattern;
  }

  // User Settings
  async getUserSettings(): Promise<UserSettings | undefined> {
    if (!this.settings) {
      const id = randomUUID();
      this.settings = {
        id,
        userId: "default",
        dataRetentionDays: 90,
        enableHapticFeedback: true,
        enableAnalytics: true,
        privacyMode: false,
        exportFormat: "json",
        theme: "dark",
      };
    }
    return this.settings;
  }

  async updateUserSettings(
    updates: Partial<InsertUserSettings>,
  ): Promise<UserSettings> {
    const current = await this.getUserSettings();
    this.settings = { ...current!, ...updates };
    return this.settings;
  }

  // Stats & Analytics
  async getTodayStats(): Promise<{
    avgIntensity: number;
    peakIntensity: number;
    stateCount: number;
    nssiCount: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStates = Array.from(this.emotionalStates.values()).filter(
      (state) => new Date(state.timestamp) >= today,
    );

    const todayNssi = Array.from(this.nssiEvents.values()).filter(
      (event) => new Date(event.timestamp) >= today,
    );

    const avgIntensity =
      todayStates.length > 0
        ? todayStates.reduce((sum, s) => sum + s.intensity, 0) /
          todayStates.length
        : 0;

    const peakIntensity =
      todayStates.length > 0
        ? Math.max(...todayStates.map((s) => s.intensity))
        : 0;

    return {
      avgIntensity,
      peakIntensity,
      stateCount: todayStates.length,
      nssiCount: todayNssi.length,
    };
  }

  async getAnalyticsSummary(): Promise<{
    avgIntensity: number;
    trendDirection: "up" | "down" | "stable";
    totalStates: number;
    totalNssiEvents: number;
    weeklyAverage: { day: string; avg: number }[];
  }> {
    const allStates = Array.from(this.emotionalStates.values());
    const avgIntensity =
      allStates.length > 0
        ? allStates.reduce((sum, s) => sum + s.intensity, 0) / allStates.length
        : 0;

    // Calculate trend (last 7 days vs previous 7 days)
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prev7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recentStates = allStates.filter(
      (s) => new Date(s.timestamp) >= last7Days,
    );
    const previousStates = allStates.filter(
      (s) =>
        new Date(s.timestamp) >= prev7Days && new Date(s.timestamp) < last7Days,
    );

    const recentAvg =
      recentStates.length > 0
        ? recentStates.reduce((sum, s) => sum + s.intensity, 0) /
          recentStates.length
        : 0;

    const prevAvg =
      previousStates.length > 0
        ? previousStates.reduce((sum, s) => sum + s.intensity, 0) /
          previousStates.length
        : 0;

    let trendDirection: "up" | "down" | "stable" = "stable";
    if (recentAvg > prevAvg + 5) trendDirection = "up";
    else if (recentAvg < prevAvg - 5) trendDirection = "down";

    // Weekly average by day
    const weeklyAverage: { day: string; avg: number }[] = [];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStates = allStates.filter((s) => {
        const sDate = new Date(s.timestamp);
        return sDate.toDateString() === date.toDateString();
      });
      const dayAvg =
        dayStates.length > 0
          ? dayStates.reduce((sum, s) => sum + s.intensity, 0) /
            dayStates.length
          : 0;
      weeklyAverage.push({ day: days[date.getDay()], avg: dayAvg });
    }

    return {
      avgIntensity,
      trendDirection,
      totalStates: this.emotionalStates.size,
      totalNssiEvents: this.nssiEvents.size,
      weeklyAverage,
    };
  }

  async getVaultStatus(): Promise<{
    totalEntries: number;
    encryptedEntries: number;
    lastHash: string;
    chainIntegrity: boolean;
  }> {
    const entries = Array.from(this.vaultEntries.values());
    const encryptedEntries = entries.filter(
      (e) => e.encryptionStatus === "encrypted",
    ).length;
    const lastHash = (await this.getLastVaultHash()) || "";

    // Check chain integrity
    const sorted = entries.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    let chainIntegrity = true;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].previousHash !== sorted[i - 1].dataHash) {
        chainIntegrity = false;
        break;
      }
    }

    return {
      totalEntries: entries.length,
      encryptedEntries,
      lastHash,
      chainIntegrity,
    };
  }

  // Data Management
  async deleteAllData(): Promise<void> {
    this.emotionalStates.clear();
    this.nssiEvents.clear();
    this.sessionLogs.clear();
    this.vaultEntries.clear();
    this.analyticsPatterns.clear();
  }

  // Helper
  private generateHash(data: string): string {
    return createHash("sha256").update(data).digest("hex");
  }
}

// Import the PrismaStorage implementation
import { prismaStorage } from "./prisma-storage";

export const storage = prismaStorage;
