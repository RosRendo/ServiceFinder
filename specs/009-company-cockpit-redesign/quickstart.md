# Quickstart & Visual Validation Guide: Company Mobile Command Cockpit Redesign

**Feature**: `specs/009-company-cockpit-redesign`  
**Date**: 2026-10-06  
**Target Subsystems**: `frontend-expo/app/(company)`, `frontend-expo/components/company`

---

## 1. Prerequisites & Environment Setup

1. **Backend Server Active**:
   - NestJS API running on `http://localhost:5000`
   - Verification command:
     ```powershell
     Invoke-WebRequest -Uri "http://localhost:5000/api/v1/health"
     ```

2. **Mobile Client Active**:
   - Expo development server running in `frontend-expo`:
     ```powershell
     cd frontend-expo
     npx expo start
     ```
   - Testable via Web browser (`w`), iOS Simulator (`i`), or Android Emulator (`a`).

---

## 2. Validation Scenarios

### Scenario 1: Top-of-Fold Urgent Dispatch Deck (Zero Scroll Response)

**Goal**: Confirm that incoming pending bookings are displayed immediately below the header without requiring the company operator to scroll past charts or financial cards.

1. **Action**:
   - Log in as Company Admin (`admin@company.com` / `password123`).
   - Land on the redesigned Company Dashboard (`app/(company)/(tabs)/dashboard.tsx`).
2. **Visual Assertions**:
   - [ ] **Immediate Fold Placement**: The `UrgentDispatchCarousel` sits directly beneath `CompanyCockpitHeader` within the top 260px of the viewport.
   - [ ] **Urgency Badge**: Each card displays a color-coded countdown badge:
     - `< 5m`: Red badge with pulsing alert dot (`3m left`).
     - `5 - 15m`: Amber badge (`11m left`).
     - `> 15m`: Slate/Green badge (`30m left`).
   - [ ] **1-Tap Action Deck**: Each card provides a high-contrast "Accept & Assign" thumb button and a compact "Decline" button.
   - [ ] **Zero Explanatory Paragraphs**: Job details are distilled into concise chips (service name, price tag, address with distance).

---

### Scenario 2: Compact Executive Cockpit Header & Live Shift Counters

**Goal**: Verify that the top header provides company identity, verification shield, dispatch toggle, and glanceable shift counters with zero introductory boilerplate.

1. **Action**:
   - Observe the top sticky section of `dashboard.tsx`.
2. **Visual Assertions**:
   - [ ] **Company Identity**: Displays company name and blue verified shield badge.
   - [ ] **Shift Pulse Toggle**: High-contrast pill toggle showing operational status (`Online` glowing green dot / `Offline` gray).
   - [ ] **Glanceable Shift Counters**: 3 compact counter capsules:
     - `Pros Online`: Number of technicians currently on shift.
     - `In Progress`: Active jobs currently being serviced.
     - `SLA Health`: Percentage compliance rate (e.g., `98%`).
   - [ ] **Zero Narrative Text**: Welcome paragraphs and instructional greetings are completely removed.

---

### Scenario 3: High-Density Financial Command Bar & Cash Audit

**Goal**: Confirm that company liquidity (wallet balance, escrow transit, crew cash hold, and daily revenue) is consolidated into an executive strip with 1-tap action shortcuts.

1. **Action**:
   - Inspect the `FinancialCommandBar` section located directly below the urgent dispatch carousel.
2. **Visual Assertions**:
   - [ ] **4-Metric Liquidity Grid**:
     - `Available Balance`: Ready for withdrawal.
     - `In Escrow`: Locked in active bookings.
     - `Crew Cash Hold`: Physical cash collected by field crew.
     - `Today Net`: Net earnings realized today.
   - [ ] **1-Tap Action Pills**: "Withdraw" button (opens withdrawal modal) and "Audit Cash" button (routes to cash remittance view).
   - [ ] **Cash Limit Alert**: If crew cash exceeds limit (default $100), an amber warning pill appears with direct audit trigger.

---

### Scenario 4: Fleet Quick-Radar & Direct Technician Shortcuts

**Goal**: Verify that active field crew members are presented in a horizontal radar strip with pulsing status rings and 1-tap call/chat triggers.

1. **Action**:
   - Scroll slightly to the `FleetQuickRadar` section.
2. **Visual Assertions**:
   - [ ] **Horizontal Technician Strip**: Displays technician avatars with pulsing status borders:
     - Green: Online / Available.
     - Amber: Currently on a job.
     - Gray: Offline / Off-shift.
   - [ ] **Glanceable Workload**: Each technician capsule displays their name and active job count (`0 jobs`, `1 job`).
   - [ ] **Instant Communication**: Tapping the Phone icon triggers device phone dialer (`tel:${phone}`), and tapping Chat triggers direct message channel.
   - [ ] **View All Crew**: Quick link to full `(company)/staff` tab.

---

### Scenario 5: Tab Bar Dynamic Dispatch Badge Synchronization

**Goal**: Verify that the floating bottom tab bar reflects real-time unassigned booking counts on the `Dispatch` (`operations`) tab.

1. **Action**:
   - Observe the floating bottom navigation bar in `frontend-expo/app/(company)/(tabs)/_layout.tsx`.
2. **Visual Assertions**:
   - [ ] **Dynamic Badge Pill**: A red/amber badge pill is rendered on the `Dispatch` tab icon when pending unassigned bookings exist.
   - [ ] **Real-Time Decrement**: Accepting or declining a booking decrements the tab bar badge immediately.

---

### Scenario 6: Customer App Frozen State & Git Diff Isolation Verification

**Goal**: Enforce the non-negotiable architectural invariant: **Zero modifications to customer screens**.

1. **Action**:
   - Execute git diff check from project root:
     ```powershell
     git diff --stat HEAD -- frontend-expo/app/(customer) frontend-expo/components/customer
     ```
2. **Assertion**:
   - [ ] Command output is completely empty (0 files changed, 0 insertions, 0 deletions under customer paths).
   - [ ] Customer tabs (Explore, Bookings, Messages, Profile) function identically with zero visual changes.

---

### Scenario 7: Monolithic Reduction & Typecheck Verification

**Goal**: Verify that `dashboard.tsx` has been decomposed into modular components and passes strict TypeScript compilation.

1. **Action**:
   - Check line count of `frontend-expo/app/(company)/(tabs)/dashboard.tsx`:
     ```powershell
     (Get-Content "frontend-expo/app/(company)/(tabs)/dashboard.tsx").Length
     ```
   - Run mobile client typecheck:
     ```powershell
     cd frontend-expo
     npx tsc --noEmit
     ```
2. **Assertion**:
   - [ ] `dashboard.tsx` line count is $\le 220$ lines (reduced from 935 lines).
   - [ ] `npx tsc --noEmit` completes with **0 errors**.
