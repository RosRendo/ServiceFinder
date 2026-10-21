# Implementation Tasks: Non-Customer Role UI Visual Upgrade & Text Distillation

**Feature**: `specs/008-role-ui-visual-upgrade`  
**Branch**: `008-role-ui-visual-upgrade`  
**Scope**: Non-Customer Roles Only (`Staff`, `Company`, `Admin`) — Customer App Frozen

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project verification and non-customer component directory preparation

- [X] T001 Verify active mobile client environment and workspace dependencies in frontend-expo/package.json
- [X] T002 [P] Establish non-customer visual component directories in frontend-expo/components/jobs, frontend-expo/components/company, and frontend-expo/components/admin

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build reusable visual components specified in contracts and data model. Must be complete before user story screens are updated.

- [X] T003 [P] Implement VisualMilestoneStepper component with 4-stage progression (EN_ROUTE, ARRIVED, WORKING, COMPLETED) and dual visual cues in frontend-expo/components/jobs/VisualMilestoneStepper.tsx
- [X] T004 [P] Implement UrgencyBadge component with color-graded countdown tiers (HEALTHY, APPROACHING, CRITICAL) and pulse animation in frontend-expo/components/common/UrgencyBadge.tsx
- [X] T005 [P] Implement ProRadarRow component with live status pulses (Online, On Job, Offline), distance chips, and one-tap communication shortcuts in frontend-expo/components/company/ProRadarRow.tsx
- [X] T006 [P] Implement CashReconciliationCard component with unremitted balance progress meter and threshold status bands (SAFE, WARNING, BREACH) in frontend-expo/components/company/CashReconciliationCard.tsx
- [X] T007 [P] Implement CredentialInspectionCard component with document preview and verify/reject action pills in frontend-expo/components/admin/CredentialInspectionCard.tsx

**Checkpoint**: Core visual components created and ready for screen integration.

---

## Phase 3: User Story 1 - Field Technician Visual Cockpit & Glanceable Execution (Priority: P1) 🎯 MVP

**Goal**: Field technician operates daily workspace with horizontal milestone stepper, compact action chips, and large-format cash meters with zero instructional paragraphs.

**Independent Test**: Log in as staff (`staff1@company.com`), navigate to Today tab, and verify that active assignment displays `VisualMilestoneStepper` without instructional paragraphs, and verify Money tab displays cash meter.

- [X] T008 [US1] Remove instructional guideline paragraphs, checklist disclaimers, and verbose status banners in frontend-expo/app/(staff)/(tabs)/today.tsx
- [X] T009 [US1] Integrate VisualMilestoneStepper and high-contrast thumb-accessible action pill into active job card in frontend-expo/app/(staff)/(tabs)/today.tsx
- [X] T010 [US1] Redesign job destination, distance meter, and customer contact shortcuts (Call/Chat) into compact visual chips in frontend-expo/app/(staff)/(tabs)/today.tsx
- [X] T011 [US1] Remove payroll disclaimer text blocks and replace with large-format net earnings numbers and period selector chips in frontend-expo/app/(staff)/(tabs)/money.tsx
- [X] T012 [US1] Integrate CashReconciliationCard with color-coded safe/warning threshold indicators in frontend-expo/app/(staff)/(tabs)/money.tsx

**Checkpoint**: User Story 1 complete — Field technicians can comprehend active jobs in <2 seconds with 0 instructional paragraphs.

---

## Phase 4: User Story 2 - Company Dispatch High-Density Visual Operations (Priority: P1)

**Goal**: Dispatcher triages incoming bookings using SLA urgency countdown chips, monitors fleet via live pro radar pulses, and audits field cash collections.

**Independent Test**: Log in as company admin (`admin@company.com`), view Operations tab with color-coded urgency badges (<5m red pulse, 5-15m amber), assign technician via 1-tap pill, view pro radar in Staff tab, and audit cash in Finance tab.

- [X] T013 [US2] Replace narrative booking descriptions with compact cards containing category icons and customer avatar chips in frontend-expo/app/(company)/(tabs)/operations.tsx
- [X] T014 [US2] Integrate UrgencyBadge SLA countdown chips (<5m pulse, 5-15m amber, >15m green) and 1-tap Assign Staff pill into dispatch cards in frontend-expo/app/(company)/(tabs)/operations.tsx
- [X] T015 [US2] Upgrade fleet roster to live pro radar using ProRadarRow with pulsing status rings and 1-tap call/chat shortcuts in frontend-expo/app/(company)/(tabs)/staff.tsx
- [X] T016 [US2] Replace bank and payroll text paragraphs with field crew cash reconciliation table and instant Settle actions in frontend-expo/app/(company)/(tabs)/finance.tsx

**Checkpoint**: User Story 2 complete — Company dispatchers can evaluate urgency in <3 seconds and manage fleet with minimal cognitive load.

---

## Phase 5: User Story 3 - Superadmin Visual Governance & Anomaly Triage (Priority: P2)

**Goal**: Superadmin verifies company credentials, triages dispatch SLA queue, and arbitrates disputes using visual inspection cards and timeline bars.

**Independent Test**: Log in as superadmin (`superadmin@servicefinder.com`), inspect pending company onboarding via credential cards with 1-tap verify/reject pills in Companies tab, and view color-graded SLA queue timeline in Queue tab.

- [X] T017 [US3] Replace text-heavy company vetting lists with CredentialInspectionCard preview components and 1-tap verify/reject pills in frontend-expo/app/(admin)/(tabs)/companies.tsx
- [X] T018 [US3] Implement color-graded SLA urgency timeline bars in global dispatch queue replacing text countdown descriptions in frontend-expo/app/(admin)/(tabs)/queue.tsx
- [X] T019 [US3] Transform dispute arbitration into visual comparative split card showing evidence photos, escrow amounts, and settlement chips in frontend-expo/app/(admin)/(tabs)/issues.tsx

**Checkpoint**: User Story 3 complete — Administrative governance runs on high-glanceability visual indicators.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verify non-regression of customer screens, dual visual cues, type safety, and quickstart scenarios.

- [X] T020 Verify zero modifications across customer routes via git diff against frontend-expo/app/(customer) and frontend-expo/components/customer
- [X] T021 [P] Verify dual visual cues (icon + label) and sunlight contrast ratios on all non-customer badges across frontend-expo/components
- [X] T022 Execute TypeScript typecheck and linting across mobile client via npx tsc --noEmit in frontend-expo
- [X] T023 Validate end-to-end quickstart scenarios from specs/008-role-ui-visual-upgrade/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — executes immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 — blocks all user story implementation.
- **User Story 1 (Phase 3 - P1)**: Depends on Phase 2 (specifically `VisualMilestoneStepper` and `CashReconciliationCard`).
- **User Story 2 (Phase 4 - P1)**: Depends on Phase 2 (specifically `UrgencyBadge`, `ProRadarRow`, and `CashReconciliationCard`).
- **User Story 3 (Phase 5 - P2)**: Depends on Phase 2 (specifically `CredentialInspectionCard` and `UrgencyBadge`).
- **Polish (Phase 6)**: Depends on all user stories being complete.

### Parallel Opportunities

- **Foundational (Phase 2)**: All 5 components (`T003`, `T004`, `T005`, `T006`, `T007`) are in separate files and can be authored in parallel.
- **User Stories (Phases 3, 4, 5)**: Once Phase 2 is complete, US1, US2, and US3 touch completely separate screens (`app/(staff)`, `app/(company)`, and `app/(admin)`) and can be developed independently or in parallel.
- **Cross-Cutting (Phase 6)**: `T020`, `T021`, and `T022` can be verified in parallel.

---

## Parallel Example: Foundational Components

```bash
# Launch creation of foundational visual components simultaneously:
Task: "Implement VisualMilestoneStepper in frontend-expo/components/jobs/VisualMilestoneStepper.tsx"
Task: "Implement UrgencyBadge in frontend-expo/components/common/UrgencyBadge.tsx"
Task: "Implement ProRadarRow in frontend-expo/components/company/ProRadarRow.tsx"
Task: "Implement CashReconciliationCard in frontend-expo/components/company/CashReconciliationCard.tsx"
Task: "Implement CredentialInspectionCard in frontend-expo/components/admin/CredentialInspectionCard.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational visual components).
2. Complete Phase 3 (User Story 1: Field Technician visual cockpit and cash meter).
3. Validate User Story 1 independently in Expo (Staff login $\rightarrow$ Today & Money tabs).
4. Verify text reduction $\ge 60\%$ on technician screens.

### Incremental Delivery

1. Setup + Foundational components $\rightarrow$ Foundation ready.
2. Deliver US1 (Staff Visual Cockpit) $\rightarrow$ MVP validation.
3. Deliver US2 (Company Dispatch High-Density & Pro Radar) $\rightarrow$ Dispatch triage validation.
4. Deliver US3 (Admin Visual Governance & SLA Queue) $\rightarrow$ Admin docket validation.
5. Polish & Verification $\rightarrow$ Run git isolation check (`app/(customer)` frozen) and full TypeScript check (`tsc --noEmit`).
