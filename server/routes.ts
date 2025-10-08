import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertEmotionalStateSchema,
  insertNssiEventSchema,
  insertSessionLogSchema,
  insertAnalyticsPatternSchema,
  insertUserSettingsSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Emotional States
  app.get("/api/emotional-states", async (req, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      let states;
      if (days !== undefined) {
        states = await storage.getEmotionalStatesByDateRange(days);
      } else {
        states = await storage.getEmotionalStates(limit);
      }
      
      res.json(states);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch emotional states" });
    }
  });

  app.get("/api/emotional-states/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const states = await storage.getRecentEmotionalStates(limit);
      res.json(states);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent emotional states" });
    }
  });

  app.post("/api/emotional-states", async (req, res) => {
    try {
      const validatedData = insertEmotionalStateSchema.parse(req.body);
      const state = await storage.createEmotionalState(validatedData);
      res.status(201).json(state);
    } catch (error) {
      res.status(400).json({ error: "Invalid emotional state data" });
    }
  });

  // NSSI Events
  app.get("/api/nssi-events", async (req, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      let events;
      if (days !== undefined) {
        events = await storage.getNssiEventsByDateRange(days);
      } else {
        events = await storage.getNssiEvents(limit);
      }
      
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch NSSI events" });
    }
  });

  app.get("/api/nssi-events/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const events = await storage.getRecentNssiEvents(limit);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent NSSI events" });
    }
  });

  app.post("/api/nssi-events", async (req, res) => {
    try {
      const validatedData = insertNssiEventSchema.parse(req.body);
      const event = await storage.createNssiEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid NSSI event data" });
    }
  });

  // Session Logs
  app.get("/api/session-logs", async (req, res) => {
    try {
      const logs = await storage.getSessionLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch session logs" });
    }
  });

  app.post("/api/session-logs", async (req, res) => {
    try {
      const validatedData = insertSessionLogSchema.parse(req.body);
      const log = await storage.createSessionLog(validatedData);
      res.status(201).json(log);
    } catch (error) {
      res.status(400).json({ error: "Invalid session log data" });
    }
  });

  // Vault
  app.get("/api/vault/entries", async (req, res) => {
    try {
      const entries = await storage.getVaultEntries();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vault entries" });
    }
  });

  app.get("/api/vault/status", async (req, res) => {
    try {
      const status = await storage.getVaultStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vault status" });
    }
  });

  app.get("/api/vault/export", async (req, res) => {
    try {
      const format = req.query.format as string || "json";
      
      const data = {
        emotionalStates: await storage.getEmotionalStates(),
        nssiEvents: await storage.getNssiEvents(),
        sessionLogs: await storage.getSessionLogs(),
        vaultEntries: await storage.getVaultEntries(),
        analyticsPatterns: await storage.getAnalyticsPatterns(),
        exportedAt: new Date().toISOString(),
      };

      if (format === "json") {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", `attachment; filename="emotional-data-${Date.now()}.json"`);
        res.json(data);
      } else if (format === "encrypted") {
        // Simple encryption placeholder (in production, use proper encryption)
        const encrypted = Buffer.from(JSON.stringify(data)).toString("base64");
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Content-Disposition", `attachment; filename="emotional-data-${Date.now()}.enc"`);
        res.send(encrypted);
      } else {
        res.status(400).json({ error: "Invalid export format" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  // Analytics
  app.get("/api/analytics/patterns", async (req, res) => {
    try {
      const patterns = await storage.getAnalyticsPatterns();
      res.json(patterns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics patterns" });
    }
  });

  app.post("/api/analytics/patterns", async (req, res) => {
    try {
      const validatedData = insertAnalyticsPatternSchema.parse(req.body);
      const pattern = await storage.createAnalyticsPattern(validatedData);
      res.status(201).json(pattern);
    } catch (error) {
      res.status(400).json({ error: "Invalid analytics pattern data" });
    }
  });

  app.get("/api/analytics/summary", async (req, res) => {
    try {
      const summary = await storage.getAnalyticsSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics summary" });
    }
  });

  // Stats
  app.get("/api/stats/today", async (req, res) => {
    try {
      const stats = await storage.getTodayStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch today's stats" });
    }
  });

  // Settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getUserSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      const validatedData = insertUserSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateUserSettings(validatedData);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ error: "Invalid settings data" });
    }
  });

  // Data Management
  app.delete("/api/data/all", async (req, res) => {
    try {
      await storage.deleteAllData();
      res.json({ message: "All data deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
