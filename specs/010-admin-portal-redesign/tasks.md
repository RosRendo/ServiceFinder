# Implementation Tasks: Admin Mobile Cockpit Redesign

**Feature Branch**: `010-admin-portal-redesign` | **Plan**: [plan.md](plan.md) | **Spec**: [spec.md](spec.md)

This task list breaks down the implementation of the Admin Mobile Cockpit Redesign into dependency-ordered, independently testable phases.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Inspect existing admin mobile shell and design tokens in `frontend-expo/constants/theme.ts`
- [x] T002 [P] Verify admin tab routes configuration in `frontend-expo/app/(admin)/(tabs)/_layout.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core UI components and styling standards that MUST be complete before user stories begin

- [x] T003 Standardize safe bottom scroll insets (`paddingBottom: 120`) and Obsidian color styles across admin tab views
- [x] T004 [P] Create reusable `ExecutiveMetricRibbon` component in `frontend-expo/components/admin/ExecutiveMetricRibbon.tsx`
- [x] T005 [P] Create reusable `SlaAlertMatrix` component in `frontend-expo/components/admin/SlaAlertMatrix.tsx`

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Executive Command Dashboard & SLA Alerts (Priority: P1) 🎯 MVP

**Goal**: Deliver a high-contrast executive cockpit dashboard with live platform GMV, commission metrics, zero hardcoded numbers, and dynamic SLA alert links.

**Independent Test**: Sign into admin on mobile, open Dashboard (`/(admin)/(tabs)/dashboard`). Verify Gross GMV card renders in Obsidian `#0A192F`, urgent alerts show real live counts, and content scrolls cleanly above the floating tab bar.

### Implementation for User Story 1

- [x] T006 [US1] Refactor `frontend-expo/app/(admin)/(tabs)/dashboard.tsx` with Obsidian `#0A192F` metrics cards and dynamic GMV breakdown
- [x] T007 [US1] Eliminate hardcoded fallback mock counts (e.g. `payoutRequests || 8`) in `frontend-expo/app/(admin)/(tabs)/dashboard.tsx`
- [x] T008 [US1] Implement interactive SLA urgency alert matrix in `frontend-expo/app/(admin)/(tabs)/dashboard.tsx` linking to verifications, disputes, and payouts
- [x] T009 [US1] Enforce `paddingBottom: 120` on `scrollContent` in `frontend-expo/app/(admin)/(tabs)/dashboard.tsx` to prevent floating tab bar collision
- [x] T010 [US1] Validate independent test scenario for User Story 1 (executive dashboard loads live metrics, cards scroll cleanly above tab bar)

**Checkpoint**: User Story 1 complete and independently verifiable as an MVP.

---

## Phase 4: User Story 2 - Rapid Business Verification & Document Inspection (Priority: P2)

**Goal**: Replace horizontal Kanban boards with segmented status tabs and provide inline credential inspection for fast company verifications.

**Independent Test**: Navigate to Approvals (`/(admin)/(tabs)/queue`), switch between status tabs, tap Inspect Credentials on a pending company, and verify application updates cleanly.

### Implementation for User Story 2

- [x] T011 [US2] Refactor `frontend-expo/app/(admin)/(tabs)/queue.tsx` to use high-contrast executive cards and segmented status tabs (`pending`, `reviewing`, `verified`, `rejected`)
- [x] T012 [US2] Integrate `CredentialInspectionCard` modal sheet for 1-tap document and license auditing in `frontend-expo/app/(admin)/(tabs)/queue.tsx`
- [x] T013 [US2] Replace horizontal multi-column Kanban slider in `frontend-expo/app/(admin)/(tabs)/companies.tsx` with segmented status filters and `@shopify/flash-list`
- [x] T014 [US2] Modernize detailed company audit screen in `frontend-expo/app/(admin)/company/[id].tsx` with executive badge pills and document inspection
- [x] T015 [US2] Validate independent test scenario for User Story 2 (verification queue switches tabs cleanly and executes 1-tap verification)

**Checkpoint**: User Stories 1 AND 2 both functional and independently verifiable.

---

## Phase 5: User Story 3 - Dispute Triage & Escrow Mediation (Priority: P3)

**Goal**: Provide structured dispute mediation cards with SLA urgency badges and a two-step confirmation safeguard for escrow distributions.

**Independent Test**: Open Issues (`/(admin)/(tabs)/issues`), view open disputes ordered by SLA deadline, tap Resolve Dispute, and verify two-step confirmation modal requires an audit note.

### Implementation for User Story 3

- [x] T016 [US3] Upgrade `frontend-expo/app/(admin)/(tabs)/issues.tsx` with SLA response deadlines, escrow amount tags, and chronologic dispute list items
- [x] T017 [US3] Create two-step confirmation modal `DisputeResolutionSheet` in `frontend-expo/components/admin/DisputeResolutionSheet.tsx` requiring resolution note before releasing escrow funds
- [x] T018 [US3] Upgrade dispute detail screen in `frontend-expo/app/(admin)/disputes/[id].tsx` with case claim timeline, provider defense, and resolution actions
- [x] T019 [US3] Validate independent test scenario for User Story 3 (dispute case opens, displays escrow sum, and requires two-step confirmation to resolve)

**Checkpoint**: User Stories 1, 2, and 3 functional and independently verifiable.

---

## Phase 6: User Story 4 - Unified Admin Operations Hub & Security Settings (Priority: P4)

**Goal**: Centralize all platform governance, financial, and operational sub-screens in an organized operations hub and sliding drawer.

**Independent Test**: Navigate to More (`/(admin)/(tabs)/settings`) and open `AdminSidebar.tsx`. Verify all platform tools (Audit, Monitoring, Payouts, Refunds, Compliance) are categorized and navigable.

### Implementation for User Story 4

- [x] T020 [US4] Redesign `frontend-expo/app/(admin)/(tabs)/settings.tsx` into an organized platform operations hub with categorized governance, financial, and operational sections
- [x] T021 [US4] Update `frontend-expo/components/AdminSidebar.tsx` with executive branding, badge indicators, and organized navigation links
- [x] T022 [US4] Modernize secondary admin screens (`payouts.tsx`, `refunds.tsx`, `audit.tsx`, `monitoring.tsx`) with cohesive executive headers and safe bottom padding
- [x] T023 [US4] Validate independent test scenario for User Story 4 (all admin governance and financial sub-screens accessible from hub with consistent styling)

**Checkpoint**: All 4 user stories complete and functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Cross-cutting verification, type safety, and regression protection

- [x] T024 [P] Verify zero Customer App touches (`frontend-expo/app/(customer)/**` remains 100% frozen)
- [x] T025 Run full TypeScript check (`npx tsc --noEmit` in `frontend-expo`) and verify 0 compilation errors
- [x] T026 Perform end-to-end walkthrough per `quickstart.md` validation scenarios

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup; BLOCKS all user stories.
- **User Stories (Phases 3–6)**: Depend on Foundational. Sequential order: US1 (MVP) → US2 → US3 → US4.
- **Polish (Phase 7)**: Depends on all user stories being complete.

---

## Implementation Strategy: MVP First
1. Complete Setup (T001–T002) and Foundational components (T003–T005).
2. Complete User Story 1 (T006–T010).
3. **Validate MVP**: Test executive dashboard metrics and safe bottom padding.
4. Incrementally deliver User Story 2 (Approvals), User Story 3 (Disputes), and User Story 4 (Hub).
5. Run TypeScript validation and regression checks (T024–T026).
