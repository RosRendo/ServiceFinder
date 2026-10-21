# Research: Admin Mobile Cockpit Redesign

## Executive Summary
This document consolidates research and design decisions for upgrading the Admin Mobile experience in `frontend-expo/app/(admin)/**` to the Quiet Luxury / Obsidian Executive standard established in Feature 009.

---

### Decision 1: Visual Theme & Color Palette

- **Decision**: Adopt the Obsidian Executive visual design system:
  - Deep Navy / Obsidian Hero Cards (`#0A192F`)
  - Crisp Surface Cards (`#FFFFFF`) with subtle border (`#E2E8F0` / `#CBD5E1`) and soft elevation
  - High-contrast typography: Title (`#0F172A`), Subtitle/Metadata (`#64748B`), Muted (`#94A3B8`)
  - Semantic Status System:
    - Verified / Active: Emerald (`#10B981`, badge bg: `rgba(16, 185, 129, 0.12)`)
    - Pending / Review: Amber (`#F59E0B`, badge bg: `rgba(245, 158, 11, 0.12)`)
    - Urgent / Dispute / Rejection: Crimson (`#EF4444`, badge bg: `rgba(239, 68, 68, 0.12)`)
    - Action / Accent: Electric Cyan / Sky (`#38BDF8` / `#0284C7`)
- **Rationale**: Eliminates the legacy rainbow box aesthetic (`#FEF3C7`, `#FEE2E2`, `#D1FAE5`) and unifies the platform with the modern executive standard.
- **Alternatives Considered**:
  - Full Dark Mode: High cognitive load during daytime outdoor auditing and inconsistent with the rest of the mobile shell.
  - Rainbow Theme: Visual fatigue, looks like a toy rather than an enterprise marketplace control center.

---

### Decision 2: Approvals Queue & Company Directory Layout Paradigm

- **Decision**: Replace the horizontal multi-column Kanban slider (`COLUMN_WIDTH = width * 0.85` in `companies.tsx`) with an ergonomic Segmented Tab Filter system:
  - Sticky or pinned top pill tabs: `Pending Review`, `Under Review`, `Verified Active`, `Suspended / Inactive`
  - High-performance vertical list rendering via `@shopify/flash-list`
  - 1-tap Document Inspection sheet powered by `CredentialInspectionCard`
- **Rationale**: Horizontal Kanbans require two-axis scrolling (horizontal across stages, vertical inside columns), which is clumsy and prone to gesture conflicts on portrait smartphones. Segmented tabs allow 1-thumb category switching with zero gesture conflict.
- **Alternatives Considered**:
  - Swipeable Card Deck (Tinder-style): Too casual, lacks scannability of multiple pending businesses.
  - Multi-column horizontal board: Hard to compare items, parts of cards are cut off by screen boundaries.

---

### Decision 3: Safe Bottom Scrolling & Floating Tab Bar Ergonomics

- **Decision**: Standardize `paddingBottom: 120` across all scrollable containers in `app/(admin)/(tabs)/**`:
  - `dashboard.tsx`
  - `queue.tsx`
  - `issues.tsx`
  - `companies.tsx`
  - `users.tsx`
  - `settings.tsx`
  - `analytics.tsx`
- **Rationale**: The floating tab bar (`FloatingTabBar` in `(tabs)/_layout.tsx`) floats above the screen at `bottom: 0`, consuming ~88dp on iOS and ~76dp on Android. Setting `paddingBottom: 60` causes the last card and buttons to be covered. Setting `paddingBottom: 120` ensures all content scrolls cleanly above the floating bar.
- **Alternatives Considered**:
  - Docked standard tab bar: Diminishes visual polish and floating glass effect.

---

### Decision 4: Dispute Triage & Escrow Mediation Safeguards

- **Decision**: Implement a two-step confirmation modal with a required administrative reason note before executing any financial mediation action:
  - Actions: `Full Refund to Customer`, `Split 50/50 Settlement`, `Release Escrow to Provider`
  - Required review note text input (minimum 10 characters)
  - Clear confirmation modal showing exact dollar amounts moving
- **Rationale**: Escrow fund distribution is financially binding. Touchscreens are prone to accidental taps; a two-step confirmation with audit logging protects marketplace funds and complies with the constitution.
- **Alternatives Considered**:
  - 1-tap direct button: High risk of mis-clicks during mobile triage.
