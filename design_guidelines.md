# Design Guidelines: Emotional Infrastructure OS

## Design Approach: Health-Focused System Design

**Selected Approach**: Design System (Health & Wellness)
**Primary Inspiration**: Apple Health's clarity + Calm app's soothing aesthetics + clinical health monitoring interfaces
**Rationale**: Mental health tracking requires trust, stability, and calm—prioritizing clarity and user wellbeing over visual trends

**Core Principles**:
- Clarity above all: Information hierarchy supports emotional clarity
- Calming presence: Design reduces anxiety, never triggers it
- Privacy by design: Visual language reinforces data sovereignty
- Accessible always: WCAG AAA compliance for vulnerable users

---

## Color Palette

**Dark Mode (Primary)**:
- Background Base: 220 15% 8%
- Surface: 220 12% 12%
- Surface Elevated: 220 10% 16%
- Border Subtle: 220 8% 20%

**Accent Colors**:
- Primary (Trust Blue): 210 80% 55%
- Primary Muted: 210 40% 45%
- Success (Calm): 160 60% 50%
- Warning (Gentle): 35 70% 60%
- Danger (Subdued): 0 50% 55%

**Text**:
- Primary: 220 10% 95%
- Secondary: 220 8% 70%
- Tertiary: 220 6% 50%

**Light Mode**:
- Background: 210 20% 98%
- Surface: 0 0% 100%
- Text Primary: 220 15% 15%
- Text Secondary: 220 10% 40%

---

## Typography

**Font Families**:
- Primary: 'Inter' (Google Fonts) - UI, body, data
- Display: 'Plus Jakarta Sans' (Google Fonts) - headers, emphasis
- Monospace: 'JetBrains Mono' - data values, timestamps

**Scale**:
- Display Large: 3rem (48px), font-bold
- Heading 1: 2rem (32px), font-semibold
- Heading 2: 1.5rem (24px), font-semibold
- Heading 3: 1.25rem (20px), font-medium
- Body: 1rem (16px), font-normal
- Body Small: 0.875rem (14px), font-normal
- Caption: 0.75rem (12px), font-medium

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Component padding: p-4 to p-6
- Section spacing: py-12 to py-20
- Card gaps: gap-4 to gap-6
- Container max-width: max-w-7xl with px-4

**Grid System**:
- Dashboard: 12-column grid (grid-cols-12)
- Analytics cards: 2-3 columns (md:grid-cols-2 lg:grid-cols-3)
- Mobile: Always single column stack

---

## Component Library

### Navigation
- **Top Nav**: Fixed header with blur backdrop (backdrop-blur-xl bg-surface/80), app logo left, settings/vault icons right
- **Sidebar** (Desktop): Collapsible 280px wide, icons + labels for: Dashboard, Waveform, History, Analytics, Vault, Settings
- **Mobile Nav**: Bottom tab bar with 5 primary sections

### Cards & Containers
- **Surface Cards**: Rounded corners (rounded-xl), subtle border (border border-subtle), padding p-6
- **Elevated Cards**: Same as surface + shadow-lg for important data (current state, alerts)
- **Vault Card**: Extra security visual—double border, lock icon, darker background

### Data Visualization
- **Waveform Display**: Full-width canvas with gradient fill (blue to purple), smooth bezier curves, touch/click responsive
- **History Charts**: Line charts with gradient fills, dot markers for events, tooltips on hover
- **Analytics Gauges**: Circular progress indicators, color-coded by severity (calm green to alert amber)

### Forms & Inputs
- **Input Fields**: Dark backgrounds matching surface, focus ring (ring-2 ring-primary), consistent h-12 height
- **Toggle Switches**: Large touch targets (w-14 h-7), smooth transitions
- **Privacy Controls**: Clear visual hierarchy with icons, helper text below each option

### Buttons
- **Primary**: bg-primary text-white, hover:bg-primary-muted
- **Secondary**: border border-primary text-primary, hover:bg-primary/10
- **Outline on Images**: Blurred background (backdrop-blur-md bg-white/20), no custom hover states
- **Icon Buttons**: Consistent 40px square, rounded-lg, hover:bg-surface-elevated

### Status Indicators
- **NSSI Alerts**: Amber badge with pulse animation (animate-pulse), rounded-full
- **Vault Status**: Green checkmark icon when secured, lock icon when accessed
- **Session State**: Color-coded dot (8px) + text label

---

## Page-Specific Layouts

### Dashboard (Entry View)
- Hero: Current emotional state as large waveform (50vh), real-time updating
- Stats Grid: 3-column (mobile: 1-col) with today's metrics
- Quick Actions: 2-column card grid for Check-in, View History, Analytics
- Recent Events: Timeline list with timestamps

### Waveform Visualization
- Full-screen canvas mode option
- Controls overlay: Record button (60px), playback speed, export
- Visual feedback: Haptic-like pulsing border on interaction
- Color shifts based on intensity (calm blue → alert amber)

### History View
- Date range selector at top
- Multi-day chart: Line graph with event markers overlaid
- Event list below chart: Expandable cards with details
- Filter options: By type, severity, date range

### Analytics Dashboard
- Summary cards row: Average state, trend direction, pattern insights
- 2-column layout: Charts left (60%), insights right (40%)
- Drill-down modals: Click any metric for detailed breakdown

### Vault View
- Hero: Large lock icon with "Sovereign Data Vault" heading
- Encryption status banner: Visual indicator of security state
- Export options: Clear CTAs for data download, encrypted backup
- Immutability proof: Timestamp chain visualization (blockchain-style)

### Settings
- Sectioned layout: Privacy, Data, Preferences, About
- Each section: Icon + heading + description + controls
- Privacy first: Data retention, deletion options prominently placed
- Export controls: One-click encrypted backup generation

---

## Animations & Interactions

**Minimal Motion Philosophy**: Respect reduced-motion preferences, use subtle transitions only

- **Page Transitions**: Fade (200ms) only, no slides
- **Waveform**: Smooth path animation (400ms ease-in-out) when updating
- **Card Hovers**: Gentle lift (translateY(-2px)) + shadow increase (300ms)
- **Status Changes**: Color transition (500ms) for state indicators
- **NO**: Aggressive animations, auto-playing effects, parallax scrolling

---

## Accessibility Requirements

- **Contrast**: WCAG AAA minimum (7:1 for body text)
- **Focus Indicators**: 3px visible outline on all interactive elements
- **Touch Targets**: Minimum 44×44px for all buttons/controls
- **Screen Reader**: Semantic HTML, ARIA labels on all visualizations
- **Dark Mode**: Fully supported with consistent implementation across all inputs
- **Keyboard Nav**: Full app navigable without mouse

---

## Images & Iconography

**Icons**: Heroicons (outline style) via CDN
- Navigation: 24px icons
- Action buttons: 20px icons
- Status indicators: 16px icons
- Semantic: Heart for emotional state, Shield for vault, Clock for history

**Images**: No decorative hero images
- Profile/Avatar: Optional user photo (48px circle)
- Empty states: Simple illustration placeholders (max 200px)
- Data visualizations: Canvas-rendered charts, not static images

---

This design creates a trustworthy, calming environment for sensitive emotional health tracking—prioritizing clarity, privacy, and user wellbeing at every touchpoint.