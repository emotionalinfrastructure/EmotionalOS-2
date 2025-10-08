import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, real, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Emotional State Entry (from SignalProcessor)
export const emotionalStates = pgTable("emotional_states", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  intensity: real("intensity").notNull(), // 0-100 scale
  valence: real("valence").notNull(), // -100 to 100 (negative to positive)
  arousal: real("arousal").notNull(), // 0-100 (calm to alert)
  note: text("note"),
  waveformData: jsonb("waveform_data").$type<number[]>(), // Array of amplitude values
});

// NSSI Events (Non-Suicidal Self-Injury tracking)
export const nssiEvents = pgTable("nssi_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  severity: integer("severity").notNull(), // 1-10 scale
  triggerType: text("trigger_type"), // environmental, emotional, social, physical
  interventionUsed: text("intervention_used"),
  note: text("note"),
  emotionalStateId: varchar("emotional_state_id").references(() => emotionalStates.id),
});

// Session Logs
export const sessionLogs = pgTable("session_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in seconds
  avgIntensity: real("avg_intensity"),
  peakIntensity: real("peak_intensity"),
  emotionalStateIds: jsonb("emotional_state_ids").$type<string[]>(),
  sessionType: text("session_type"), // tracking, intervention, reflection
  metadata: jsonb("metadata"),
});

// Vault Entries (Immutable proof-of-sovereignty records)
export const vaultEntries = pgTable("vault_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  dataHash: text("data_hash").notNull(), // Cryptographic hash for immutability
  entryType: text("entry_type").notNull(), // emotional_state, nssi_event, session_log
  referenceId: varchar("reference_id").notNull(), // ID of the referenced record
  encryptionStatus: text("encryption_status").notNull().default("encrypted"),
  previousHash: text("previous_hash"), // For blockchain-style chaining
});

// Analytics Patterns
export const analyticsPatterns = pgTable("analytics_patterns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  detectedAt: timestamp("detected_at").notNull().defaultNow(),
  patternType: text("pattern_type").notNull(), // trend, cycle, trigger, correlation
  description: text("description").notNull(),
  confidence: real("confidence"), // 0-1 scale
  dataPoints: jsonb("data_points"),
  recommendation: text("recommendation"),
});

// User Settings
export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().default("default"), // Single user for now
  dataRetentionDays: integer("data_retention_days").default(90),
  enableHapticFeedback: boolean("enable_haptic_feedback").default(true),
  enableAnalytics: boolean("enable_analytics").default(true),
  privacyMode: boolean("privacy_mode").default(false),
  exportFormat: text("export_format").default("json"), // json, csv, encrypted
  theme: text("theme").default("dark"),
});

// Insert schemas
export const insertEmotionalStateSchema = createInsertSchema(emotionalStates).omit({ id: true, timestamp: true });
export const insertNssiEventSchema = createInsertSchema(nssiEvents).omit({ id: true, timestamp: true });
export const insertSessionLogSchema = createInsertSchema(sessionLogs).omit({ id: true });
export const insertVaultEntrySchema = createInsertSchema(vaultEntries).omit({ id: true, timestamp: true });
export const insertAnalyticsPatternSchema = createInsertSchema(analyticsPatterns).omit({ id: true, detectedAt: true });
export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({ id: true });

// Types
export type EmotionalState = typeof emotionalStates.$inferSelect;
export type InsertEmotionalState = z.infer<typeof insertEmotionalStateSchema>;

export type NssiEvent = typeof nssiEvents.$inferSelect;
export type InsertNssiEvent = z.infer<typeof insertNssiEventSchema>;

export type SessionLog = typeof sessionLogs.$inferSelect;
export type InsertSessionLog = z.infer<typeof insertSessionLogSchema>;

export type VaultEntry = typeof vaultEntries.$inferSelect;
export type InsertVaultEntry = z.infer<typeof insertVaultEntrySchema>;

export type AnalyticsPattern = typeof analyticsPatterns.$inferSelect;
export type InsertAnalyticsPattern = z.infer<typeof insertAnalyticsPatternSchema>;

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
