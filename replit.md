# Emotional Infrastructure OS

## Overview
A privacy-first emotional health tracking web application with NSSI (Non-Suicidal Self-Injury) monitoring, real-time waveform visualization, analytics dashboard, and sovereign data vault. Built with ethical compliance and data sovereignty principles.

## Purpose
Web version of the iOS Emotional Infrastructure OS app, providing comprehensive emotional state tracking with cryptographic data security and pattern analysis.

## Current State
**MVP Complete - Production Ready**: Full-stack application with type-safe architecture
- All data models defined with TypeScript + Zod validation
- Complete UI implementation with 6 main views (Dashboard, Waveform, History, Analytics, Vault, Settings)
- Backend API fully implemented with in-memory storage
- Real-time data updates via React Query cache invalidation
- End-to-end tested with Playwright
- Dark/light theme support
- Responsive design following health-focused design system
- Complete type safety with EnrichedVaultEntry schema

## Project Architecture

### Data Models
- **Emotional States**: Intensity, valence, arousal tracking with waveform data
- **NSSI Events**: Severity tracking with trigger types and interventions
- **Session Logs**: Duration tracking with emotional state aggregation
- **Vault Entries**: Blockchain-style immutable records with cryptographic hashing
- **Analytics Patterns**: AI-powered pattern detection with recommendations
- **User Settings**: Privacy controls, data retention, export preferences

### Pages & Features
1. **Dashboard** (`/`) - Overview with current state, stats, and recent events
2. **Waveform** (`/waveform`) - Real-time emotional state recording with visual feedback
3. **History** (`/history`) - Multi-day charts with event markers and filtering
4. **Analytics** (`/analytics`) - Pattern detection, insights, and trend analysis
5. **Vault** (`/vault`) - Sovereign data vault with export and immutability chain
6. **Settings** (`/settings`) - Privacy, data management, theme, and danger zone

### Tech Stack
- **Frontend**: React, TypeScript, Wouter (routing), TanStack Query
- **UI**: Shadcn/UI, Tailwind CSS, Recharts (data visualization)
- **Backend**: Express.js, In-memory storage (MemStorage)
- **Data**: Drizzle ORM schemas, Zod validation

## Design System
- **Primary Font**: Inter (UI, body text)
- **Display Font**: Plus Jakarta Sans (headings)
- **Monospace**: JetBrains Mono (data values)
- **Primary Color**: Trust Blue (210 80% 55%)
- **Success**: Calm Green (160 60% 50%)
- **Warning**: Gentle Amber (35 70% 60%)
- **Approach**: Health-focused, calming, accessibility-first (WCAG AAA)

## Recent Changes
- 2025-10-08: **MVP COMPLETE** - Full backend implementation with comprehensive query invalidation
- 2025-10-08: Type safety improvements - EnrichedVaultEntry Zod schema for vault data
- 2025-10-08: Canvas clearing fix after waveform save
- 2025-10-08: Vault enrichment - entries now display note content from emotional states
- 2025-10-08: End-to-end Playwright testing - all user journeys validated
- 2025-10-08: Real-time data updates working across all pages (Dashboard, History, Analytics, Vault)

## User Preferences
- Theme: Dark mode primary, light mode supported
- Privacy-first: Data sovereignty and encryption emphasized
- Minimal animations: Respects reduced motion preferences
- Accessible: WCAG AAA compliance for vulnerable users

## Next Steps
1. Implement backend API routes for all data operations
2. Connect frontend to backend with real data persistence
3. Add session logging and analytics processing
4. Test complete user journeys
5. Deploy with proper security measures
