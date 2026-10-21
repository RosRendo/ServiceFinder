# Implementation Tasks: Enterprise Clean Business Admin Portal Redesign

**Feature Branch**: `011-redesign-all-page` | **Plan**: [plan.md](plan.md) | **Spec**: [spec.md](spec.md)

This task list breaks down the implementation of the Enterprise Clean Business Admin Portal Redesign into dependency-ordered, independently testable phases.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic design token inspection

- [x] T001 Inspect existing color tokens in `frontend-expo/constants/theme.ts` and confirm clean business slate values (`#0F172A`, `#334155`, `#64748B`, `#E2E8F0`, `#F8FAFC`)
- [x] T002 [P] Verify admin navigation routes and floating tab bar clearance in `frontend-expo/app/(admin)/(tabs)/_layout.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core UI components and styling standards that MUST be complete before user stories begin

- [x] T003 Standardize monochrome and charcoal corporate styling in `frontend-expo/components/admin/ExecutiveMetricRibbon.tsx` eliminating multi-color tints and decorative background rings
- [x] T004 [P] Refactor `frontend-expo/components/admin/SlaAlertMatrix.tsx` to replace saturated badge fills with neutral `#FFFFFF` cards, hairline `#E2E8F0` borders, and subtle semantic indicator dots
- [x] T005 [P] Audit `frontend-expo/components/admin/CredentialInspectionCard.tsx` to ensure high-density two-column metadata layout and clean neutral inspection tags

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Sober Executive Command & Operational Triage (Priority: P1) 🎯 MVP

**Goal**: Deliver a sober, high-contrast executive command dashboard with platform GMV, commission metrics, zero candy colors, and high-density operational triage cards.

**Independent Test**: Sign into admin on mobile, open Dashboard (`/(admin)/(tabs)/dashboard`). Verify Gross GMV renders in deep institutional slate, triage matrix uses neutral white cards with discrete status dots, and content scrolls cleanly with `paddingBottom: 120`.

### Implementation for User Story 1

- [x] T006 [US1] Refactor `frontend-expo/app/(admin)/(tabs)/dashboard.tsx` with sober monochromatic hero cards and structured key-value GMV metrics
- [x] T007 [US1] Update platform health metrics in `frontend-expo/app/(admin)/(tabs)/dashboard.tsx` to eliminate candy-colored icon wrappers in favor of neutral `#F1F5F9` surfaces and dark slate typography
- [x] T008 [US1] Standardize monthly revenue chart styling in `frontend-expo/app/(admin)/(tabs)/dashboard.tsx` using monochrome slate bars (`#0F172A` active, `#CBD5E1` inactive)
- [x] T009 [US1] Polish recent companies triage list in `frontend-expo/app/(admin)/(tabs)/dashboard.tsx` with discrete status dots and aligned business metadata
- [x] T010 [US1] Enforce `paddingBottom: 120` on `scrollContent` in `frontend-expo/app/(admin)/(tabs)/dashboard.tsx` to eliminate floating tab bar collision
- [x] T011 [US1] Validate independent test scenario for User Story 1 (executive dashboard loads live metrics with clean business hierarchy and zero rainbow colors)

**Checkpoint**: User Story 1 complete and independently verifiable as an MVP.

---

## Phase 4: User Story 2 - High-Density Business Verification & Directory Hierarchy (Priority: P2)

**Goal**: Establish clean two-column metadata ledgers, smooth segmented status filtering, and streamlined credential inspection across KYC queues and company directory.

**Independent Test**: Navigate to Approvals (`/(admin)/(tabs)/queue`) and Marketplace (`/(admin)/(tabs)/companies`). Switch segmented tabs, inspect business registration details, and execute verification without visual stutter.

### Implementation for User Story 2

- [x] T012 [US2] Refactor `frontend-expo/app/(admin)/(tabs)/queue.tsx` to use structured two-column business ledgers (Owner, Registration No, City, Phone) with hairline dividers
- [x] T013 [US2] Update status indicators in `frontend-expo/app/(admin)/(tabs)/queue.tsx` to use subtle semantic dots (`#059669` verified, `#D97706` pending, `#DC2626` rejected) on neutral pills
- [x] T014 [US2] Polish `frontend-expo/app/(admin)/(tabs)/companies.tsx` with clean corporate cards, single-axis segmented filter tabs, and fast vertical FlashList rendering
- [x] T015 [US2] Refactor detailed company audit screen in `frontend-expo/app/(admin)/company/[id].tsx` with structured bento cells, neutral document viewer, and high-contrast charcoal action buttons
- [x] T016 [US2] Validate independent test scenario for User Story 2 (KYC queue and marketplace directory display structured business ledgers and execute 1-tap verification)

**Checkpoint**: User Stories 1 AND 2 both functional and independently verifiable.

---

## Phase 5: User Story 3 - Institutional Dispute Mediation & Escrow Arbitration Workflow (Priority: P3)

**Goal**: Deliver a neutral arbitration interface with comparative claimant vs provider statements, clear escrow custody ribbons, and two-step settlement safeguards.

**Independent Test**: Open Issues (`/(admin)/(tabs)/issues`), view dispute cases sorted by SLA deadline, select a case, and verify side-by-side evidence inspection and two-step settlement modal.

### Implementation for User Story 3

- [x] T017 [US3] Refactor `frontend-expo/app/(admin)/(tabs)/issues.tsx` to use clean neutral cards with discrete SLA countdown badges and prominent escrow hold tags
- [x] T018 [US3] Polish comparative claimant vs provider split blocks in `frontend-expo/app/(admin)/(tabs)/issues.tsx` with structured neutral divider columns
- [x] T019 [US3] Update two-step settlement modal `frontend-expo/components/admin/DisputeResolutionSheet.tsx` with sober corporate options (Refund, Split, Release) and mandatory audit note input
- [x] T020 [US3] Modernize dispute case detail screen in `frontend-expo/app/(admin)/disputes/[id].tsx` with custodial escrow ribbon, evidence history, and settlement safeguard integration
- [x] T021 [US3] Validate independent test scenario for User Story 3 (dispute case opens, displays side-by-side statements, and requires two-step confirmation with written note to resolve)

**Checkpoint**: User Stories 1, 2, and 3 functional and independently verifiable.

---

## Phase 6: User Story 4 - Unified Corporate Governance, User Directory & Secondary Tools (Priority: P4)

**Goal**: Harmonize all operations, user management, financial ledgers, and telemetry screens into a cohesive enterprise administration suite.

**Independent Test**: Navigate to More (`/(admin)/(tabs)/settings`) and open `AdminSidebar.tsx`. Visit User Directory, System Audit, Infrastructure Telemetry, Payouts, and Refunds. Verify uniform headers, back navigation, and safe bottom clearance.

### Implementation for User Story 4

- [x] T022 [US4] Refactor `frontend-expo/app/(admin)/(tabs)/settings.tsx` into a structured corporate Operations Hub with categorized governance, financial, and configuration rows
- [x] T023 [US4] Modernize user directory in `frontend-expo/app/(admin)/(tabs)/users.tsx` with clean business account rows, role badges, and search filtering
- [x] T024 [US4] Refactor platform analytics in `frontend-expo/app/(admin)/(tabs)/analytics.tsx` with institutional telemetry cards and monochrome chart metrics
- [x] T025 [US4] Update sliding drawer `frontend-expo/components/AdminSidebar.tsx` with corporate Obsidian branding, categorized groups, and reliable tab navigation
- [x] T026 [US4] Harmonize secondary screens (`payouts.tsx`, `refunds.tsx`, `audit.tsx`, `monitoring.tsx`) with consistent executive headers, back navigation, and safe bottom padding (`paddingBottom: 120`)
- [x] T027 [US4] Validate independent test scenario for User Story 4 (all governance and financial sub-screens accessible with cohesive clean business styling)

**Checkpoint**: All 4 user stories complete and functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Cross-cutting verification, type safety, and regression protection

- [x] T028 [P] Verify zero Customer App touches (`frontend-expo/app/(customer)/**` remains 100% frozen)
- [x] T029 Run full TypeScript compiler verification (`npx tsc --noEmit` in `frontend-expo`) and verify 0 compilation errors
- [x] T030 Execute end-to-end validation walkthrough per `quickstart.md` scenarios

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
2. Complete User Story 1 (T006–T011).
3. **Validate MVP**: Test sober executive dashboard metrics and clearance above floating tab bar.
4. Incrementally deliver User Story 2 (KYC Approvals & Directory), User Story 3 (Disputes & Arbitration), and User Story 4 (Operations Hub & Secondary Screens).
5. Run TypeScript validation and regression checks (T028–T030).
