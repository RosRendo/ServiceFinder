# Tasks: Company Mobile Command Cockpit & Operational Flow Redesign

**Branch**: `009-company-cockpit-redesign` | **Date**: 2026-10-06 | **Spec**: [specs/009-company-cockpit-redesign/spec.md](file:///d:/FOR%20RENDO%20%28ONLY%20%29/Personal%20Project/Service_Finder/specs/009-company-cockpit-redesign/spec.md) | **Plan**: [specs/009-company-cockpit-redesign/plan.md](file:///d:/FOR%20RENDO%20%28ONLY%20%29/Personal%20Project/Service_Finder/specs/009-company-cockpit-redesign/plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish type definitions, shared SLA helpers, and directory structure for company cockpit modularization.

- [X] T001 Inspect and verify directory structure for company components under `frontend-expo/components/company/`
- [X] T002 [P] Define TypeScript interfaces and contracts for cockpit components in `frontend-expo/types/cockpit.ts` matching `specs/009-company-cockpit-redesign/data-model.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core calculation helpers and compact visual widgets required by all user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 Implement shared SLA countdown helper `calculateSlaRemaining(bookingDate, createdAt)` in `frontend-expo/utils/slaHelper.ts` with color thresholds (`<5m` red pulse, `5-15m` amber, `>15m` green)
- [X] T004 [P] Implement compact Sparkline/Mini-Bar renderer `CompanyMiniTrend.tsx` in `frontend-expo/components/company/CompanyMiniTrend.tsx` to replace bulky 250px chart

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Priority Triage & Instant Dispatch Cockpit (Priority: P1) 🎯 MVP

**Goal**: Deliver top-of-fold priority triage deck rendering incoming bookings with SLA countdown badges and 1-tap "Accept & Assign" / "Decline" thumb pills.

**Independent Test**: Log in as company admin (`admin@company.com`), open dashboard, and verify incoming bookings appear at the very top of the screen with active SLA badges (`<5m`, `12m left`), payout chips, and 1-tap Accept/Assign controls without scrolling.

### Implementation for User Story 1

- [X] T005 [P] [US1] Create `UrgentDispatchCarousel.tsx` in `frontend-expo/components/company/UrgentDispatchCarousel.tsx` rendering top-of-fold incoming bookings with `UrgencyBadge` (<5m pulse, 12m), customer name, service icon, payout chip, and 1-tap "Accept & Assign" / "Decline" thumb pills per component contract
- [X] T006 [US1] Implement inline 1-tap assignment modal trigger and decline confirmation in `UrgentDispatchCarousel.tsx`
- [X] T007 [US1] Implement compact "Queue Cleared / Operational Normal" zero-state card in `UrgentDispatchCarousel.tsx` when `pendingBookings.length === 0`

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Unified Financial Health & Cash Reconciliation Bar (Priority: P1)

**Goal**: Provide high-density liquidity summary consolidating wallet balance, escrow transit, crew cash hold, and daily revenue with 1-tap shortcuts.

**Independent Test**: View financial command bar on dashboard, verify accurate synchronization with metrics API, and execute 1-tap shortcuts for "Withdraw" and "Audit Crew Cash".

### Implementation for User Story 2

- [X] T008 [P] [US2] Create `FinancialCommandBar.tsx` in `frontend-expo/components/company/FinancialCommandBar.tsx` presenting 4-metric liquidity grid (Available Balance, Escrow Transit, Crew Physical Cash, Today Net Revenue)
- [X] T009 [US2] Implement unremitted cash alert badge (`unremittedCrewCash >= cashRemittanceLimit`) with 1-tap "Audit Crew Cash" shortcut in `FinancialCommandBar.tsx`
- [X] T010 [US2] Connect 1-tap "Withdraw" shortcut to payout transfer route in `FinancialCommandBar.tsx`

**Checkpoint**: User Stories 1 and 2 both operate independently and cohesively.

---

## Phase 5: User Story 3 - Live Fleet Availability & Pro Quick-Radar (Priority: P2)

**Goal**: Display horizontal live crew status strip displaying on-shift technicians with pulsing status rings and 1-tap call/chat shortcuts.

**Independent Test**: View dashboard fleet strip, confirm live status rings (Online = Green, On-Job = Amber, Offline = Gray), and tap phone/chat icons to initiate instant contact with a technician.

### Implementation for User Story 3

- [X] T011 [P] [US3] Create `FleetQuickRadar.tsx` in `frontend-expo/components/company/FleetQuickRadar.tsx` rendering horizontal live technician strip with pulsing status rings (Online = Green, On-Job = Amber, Offline = Gray) and active workload capsule
- [X] T012 [US3] Implement 1-tap communication shortcuts (native Phone dialer `tel:${phone}` and direct Chat navigation) in `FleetQuickRadar.tsx`
- [X] T013 [US3] Add "View Full Fleet" shortcut routing to map-based fleet view in `(company)/staff` tab in `FleetQuickRadar.tsx`

**Checkpoint**: Fleet availability and direct technician communication are fully testable.

---

## Phase 6: User Story 4 - High-Velocity Flow, Fast-Tab Navigation & Monolithic Dashboard Re-assembly (Priority: P2)

**Goal**: Complete executive cockpit header, floating tab bar badge synchronization, and assemble all subcomponents into `dashboard.tsx` reducing line count from 935 to $\le 220$ lines.

**Independent Test**: Navigate across bottom tab bar verifying dynamic badge counters on Dispatch tab, test pull-to-refresh on dashboard, and verify line count is $\le 220$ lines.

### Implementation for User Story 4

- [X] T014 [P] [US4] Create `CompanyCockpitHeader.tsx` in `frontend-expo/components/company/CompanyCockpitHeader.tsx` with executive company title, verified shield, shift status toggle, and glanceable counters (Online Pros, In Progress, SLA Health %)
- [X] T015 [US4] Update floating bottom navigation in `frontend-expo/app/(company)/(tabs)/_layout.tsx` to dynamically render pending booking counter badge on `Dispatch` (`operations`) tab
- [X] T016 [US4] Refactor `frontend-expo/app/(company)/(tabs)/dashboard.tsx` to integrate `CompanyCockpitHeader`, `UrgentDispatchCarousel` (immediate top-of-fold), `FinancialCommandBar`, `FleetQuickRadar`, and `CompanyMiniTrend`, reducing total screen line count from 935 to $\le 220$ lines
- [X] T017 [US4] Implement concurrent data fetching across `/api/companies/my-company`, `/api/companies/my-company/metrics`, and `/api/bookings` with pull-to-refresh state in `dashboard.tsx`

**Checkpoint**: All 4 user stories are integrated into the streamlined command cockpit.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Design standards verification, customer isolation enforcement, and build validation.

- [X] T018 Verify text distillation and dual visual cues across all 4 cockpit components (icon + $\le 2$-word label, zero wordy paragraphs) in `frontend-expo/components/company/`
- [X] T019 Verify customer app boundary isolation with git diff check (`frontend-expo/app/(customer)/**` must have 0 diff)
- [X] T020 Run full TypeScript verification `npx tsc --noEmit` in `frontend-expo` ensuring 0 compilation errors
- [X] T021 Execute validation scenarios from `specs/009-company-cockpit-redesign/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories.
- **User Stories (Phase 3-6)**:
  - User Story 1 (P1): Can start after Foundational (Phase 2).
  - User Story 2 (P1): Can start after Foundational (Phase 2).
  - User Story 3 (P2): Can start after Foundational (Phase 2).
  - User Story 4 (P2): Depends on US1, US2, US3 components to assemble into `dashboard.tsx` and `_layout.tsx`.
- **Polish (Phase 7)**: Depends on all user stories being complete.

### Parallel Opportunities

- `T002` (Types) and `T004` (Mini Trend) can be built in parallel.
- `T005` (`UrgentDispatchCarousel`), `T008` (`FinancialCommandBar`), `T011` (`FleetQuickRadar`), and `T014` (`CompanyCockpitHeader`) can be developed in parallel as isolated components before assembly in `T016`.
- `T018`, `T019`, and `T020` in Polish can execute in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1: Setup (`T001`, `T002`).
2. Complete Phase 2: Foundational (`T003`, `T004`).
3. Complete Phase 3: User Story 1 (`T005` - `T007`).
4. **STOP and VALIDATE**: Test `UrgentDispatchCarousel` with live urgency countdown and 1-tap accept/assign.

### Incremental Delivery
1. Add User Story 2 (`T008` - `T010`) -> Test liquidity grid and unremitted cash alert.
2. Add User Story 3 (`T011` - `T013`) -> Test live technician radar and 1-tap call/chat shortcuts.
3. Add User Story 4 (`T014` - `T017`) -> Reassemble `dashboard.tsx` into a high-speed cockpit under 220 lines and synchronize tab bar badges.
4. Execute Polish (`T018` - `T021`) -> Confirm zero customer diff and zero TypeScript errors.
