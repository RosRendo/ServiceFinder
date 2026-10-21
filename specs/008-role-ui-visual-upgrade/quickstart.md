# Quickstart & Visual Validation Guide: Non-Customer Role UI Visual Upgrade

**Feature**: `specs/008-role-ui-visual-upgrade`  
**Date**: 2026-10-05  
**Target Subsystems**: `frontend-expo/app/(staff)`, `frontend-expo/app/(company)`, `frontend-expo/app/(admin)`

---

## 1. Prerequisites & Environment Setup

1. **Backend Server Active**:
   - NestJS API running on `http://localhost:5000`
   - Verification command: `curl http://localhost:5000/api/v1/health` (or `Invoke-WebRequest -Uri "http://localhost:5000/api/v1/health"`)

2. **Mobile Client Active**:
   - Expo development server running in `frontend-expo`:
     ```powershell
     cd frontend-expo
     npx expo start
     ```
   - Testable via Web browser (`w`), iOS Simulator (`i`), or Android Emulator (`a`).

---

## 2. Validation Scenarios

### Scenario 1: Field Technician Glanceability & Text Reduction Check (Staff Cockpit)

**Goal**: Confirm that `app/(staff)/(tabs)/today.tsx` renders a visual milestone stepper and active job details without multi-sentence explanatory paragraphs.

1. **Action**:
   - Log in as a Field Technician (`staff1@company.com` / `password123`).
   - Navigate to the **Today** tab.
2. **Visual Assertions**:
   - [ ] **Milestone Stepper**: A 4-stage horizontal bar is rendered (`En Route` $\rightarrow$ `Arrived` $\rightarrow$ `Working` $\rightarrow$ `Done`) with icons and active highlighted node.
   - [ ] **Zero Explanatory Paragraphs**: No multi-sentence instructional guidelines or checklist disclaimers appear above or below the job card.
   - [ ] **Compact Job Card**: Destination address, distance pill (`2.4 km`), customer name, and contact shortcuts (Phone icon, Chat icon) are readable within 2 seconds.
   - [ ] **Single Action Thumb Pill**: Primary status transition button is large, high-contrast, and thumb-accessible.

---

### Scenario 2: Staff Financial Workspace Text Removal & Cash Meter

**Goal**: Confirm that `app/(staff)/(tabs)/money.tsx` presents large-format metrics and a visual cash meter with zero wordy payroll disclaimers.

1. **Action**:
   - Navigate to the **Money** tab in the Staff workspace.
2. **Visual Assertions**:
   - [ ] **Prominent Net Earnings**: Large numerical display (e.g., `$420.50`) with compact period selector chips (Today, Week, Month).
   - [ ] **Visual Cash Card**: Unremitted physical cash balance is displayed with a color-coded status bar (Green for safe, Amber for approaching limit).
   - [ ] **Zero Text Clutter**: Payroll disclaimer text block ("Your earnings are calculated automatically...") is eliminated.

---

### Scenario 3: Company Dispatch High-Density Operations & Urgency Triage

**Goal**: Verify that `app/(company)/(tabs)/operations.tsx` presents incoming bookings with color-graded urgency countdown chips and 1-tap assignment triggers.

1. **Action**:
   - Log in as Company Admin (`admin@company.com` / `password123`).
   - Navigate to the **Operations** tab.
2. **Visual Assertions**:
   - [ ] **High-Density Rows**: Bookings are structured as compact cards with service category icons, booking ID chip, and customer avatar.
   - [ ] **SLA Urgency Badge**: Each card displays a color-coded countdown badge:
     - `> 15m`: Slate/Green badge (`30m left`).
     - `5 - 15m`: Amber badge (`10m left`).
     - `< 5m`: Red badge with pulsing alert dot (`3m left`).
   - [ ] **1-Tap Assignment Pill**: Prominent "Assign" button directly triggers technician assignment modal without opening nested sub-screens.

---

### Scenario 4: Company Pro Radar & Live Staff Fleet Ergonomics

**Goal**: Confirm that `app/(company)/(tabs)/staff.tsx` displays live technician pulses, distance indicators, and 1-tap call/chat shortcuts.

1. **Action**:
   - In Company console, navigate to the **Staff** tab.
2. **Visual Assertions**:
   - [ ] **Live Status Pulses**: Glowing green pulse for Online, solid amber for On Job, gray for Offline.
   - [ ] **Pro Info Density**: Displays staff name, rating stars (`★ 4.9`), active workload count (`1 job`), and distance from depot.
   - [ ] **Quick Action Icons**: Dedicated phone icon and chat icon buttons on each row allow instant communication.

---

### Scenario 5: Superadmin Visual Governance & Credential Cards

**Goal**: Verify that `app/(admin)/(tabs)/companies.tsx` and `queue.tsx` present visual document preview cards and SLA timeline bars.

1. **Action**:
   - Log in as Superadmin (`superadmin@servicefinder.com` / `password123`).
   - Navigate to **Companies** vetting tab and **Queue** dispatch tab.
2. **Visual Assertions**:
   - [ ] **Visual Credential Cards**: Business licenses and insurance documents are presented with thumbnail previews and instant "Verify" / "Reject" pills.
   - [ ] **SLA Urgency Timeline**: Pending global dispatch items are sorted by color-graded urgency bars.
   - [ ] **Dispute Evidence Split**: Escalated claims in `issues.tsx` show evidence photos side-by-side with escrow values.

---

### Scenario 6: Customer App Frozen State & Git Diff Isolation Verification

**Goal**: Enforce the non-negotiable rule: **Zero modifications to customer screens**.

1. **Action**:
   - Run git diff check from project root:
     ```powershell
     git diff --stat HEAD -- frontend-expo/app/(customer) frontend-expo/components/customer
     ```
2. **Assertion**:
   - [ ] Command output is completely empty (0 files changed, 0 insertions, 0 deletions under customer paths).
   - [ ] Customer tabs (Explore, Bookings, Messages, Profile) function identically with zero visual changes.

---

### Scenario 7: Automated Typecheck & Lint Verification

**Goal**: Ensure zero TypeScript regressions across the mobile application.

```powershell
cd frontend-expo
npm run lint
npx tsc --noEmit
```

**Assertion**:
- [ ] TypeScript check completes with **0 errors**.
- [ ] ESLint completes with 0 fatal errors.
