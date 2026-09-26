# Tasks: Comprehensive Portal Sidebar Audit & Page-by-Page Redesign

**Feature Branch**: `004-portal-pages-redesign`  
**Feature Spec**: [spec.md](spec.md)  
**Implementation Plan**: [plan.md](plan.md)  
**Data Model**: [data-model.md](data-model.md)  
**Contracts**: [contracts/button-action-contract.md](contracts/button-action-contract.md) | [contracts/page-upgrade-ledger.md](contracts/page-upgrade-ledger.md)

---

## Phase 1: Setup (Audit Infrastructure & Routing Verification)

**Purpose**: Establish audit infrastructure and verify routing integrity across all 45+ sidebar navigation routes.

- [X] T001 Initialize page upgrade ledger and route checklist in `specs/004-portal-pages-redesign/contracts/page-upgrade-ledger.md`
- [X] T002 [P] Verify routing integrity and route resolution for all 26 Admin routes in `frontend/app/admin/` and 19 Company routes in `frontend/app/company/` per `specs/004-portal-pages-redesign/research.md`

---

## Phase 2: Foundational (Action Schema, Invariants & Missing Drawer Primitives)

**Purpose**: Core action definitions, data invariants, and missing drawer components that MUST be complete before page-by-page refactoring.

**⚠️ CRITICAL**: No user story work can begin until this foundational phase is complete.

- [X] T003 Define `ActionFeedbackType` ('navigate' | 'open_drawer' | 'open_modal' | 'trigger_mutation' | 'toggle_filter') and `ActionButtonDefinition` enforcing Rule 1 verbatim: "target cannot be undefined, null, '', or a no-op function () => {}" in `frontend/types/actions.ts`
- [X] T004 [P] Create missing `DisputeDrawer.tsx` with `SlideoverDrawerProps` badge variant ('neutral' | 'success' | 'warning' | 'danger') enforcing Rule 2 verbatim: "Any button specifying open_drawer must have a corresponding drawer state handler and non-empty drawer component bound to the page shell" in `frontend/components/drawers/DisputeDrawer.tsx`
- [X] T005 [P] Create missing `ServiceAreaDrawer.tsx` with `SlideoverDrawerProps` and active district/polygon save handlers in `frontend/components/drawers/ServiceAreaDrawer.tsx`
- [X] T006 [P] Create missing `CommissionRuleDrawer.tsx` with tier threshold inputs and verified mutation handler in `frontend/components/drawers/CommissionRuleDrawer.tsx`
- [X] T007 [P] Enhance `EmptyState.tsx` in `frontend/components/admin/EmptyState.tsx` ensuring exactly one primary action button with a non-empty handler per `specs/004-portal-pages-redesign/contracts/button-action-contract.md`

**Checkpoint**: Foundation ready - page-by-page audit, button pruning, and redesign can now proceed in parallel.

---

## Phase 3: User Story 1 - Flawless Sidebar Navigation & Zero Dead Buttons (Priority: P1) 🎯 MVP

**Goal**: Every sidebar link loads an active page; every single button in tables, views, and drawers triggers a real action or is pruned. Zero silent clicks.

**Independent Test**: Navigate to every sidebar page, click every button in headers, tables, and drawers. Verify 100% of clicks trigger visible feedback (drawer, modal, toast, or navigation).

### Implementation for User Story 1

- [X] T008 [P] [US1] Audit & prune dead buttons in Admin Overview pages (`frontend/app/admin/dashboard/page.tsx`, `frontend/app/admin/analytics/page.tsx`, `frontend/app/admin/reports/page.tsx`) enforcing Rule 1 verbatim: "target cannot be undefined, null, '', or a no-op function () => {}"
- [X] T009 [P] [US1] Audit & prune dead buttons in Admin Trust & Operations pages (`frontend/app/admin/bookings/page.tsx`, `frontend/app/admin/service-areas/page.tsx`, `frontend/app/admin/disputes/page.tsx`, `frontend/app/admin/moderation/page.tsx`, `frontend/app/admin/support/page.tsx`)
- [X] T010 [P] [US1] Audit & prune dead buttons in Admin Marketplace & Catalog pages (`frontend/app/admin/companies/page.tsx`, `frontend/app/admin/users/page.tsx`, `frontend/app/admin/staff/page.tsx`, `frontend/app/admin/categories/page.tsx`, `frontend/app/admin/service-types/page.tsx`)
- [X] T011 [P] [US1] Audit & prune dead buttons in Admin Growth, Finance & Platform pages (`frontend/app/admin/broadcasts/page.tsx`, `frontend/app/admin/promotions/page.tsx`, `frontend/app/admin/featured/page.tsx`, `frontend/app/admin/transactions/page.tsx`, `frontend/app/admin/payouts/page.tsx`, `frontend/app/admin/refunds/page.tsx`, `frontend/app/admin/settings/page.tsx`, `frontend/app/admin/monitoring/page.tsx`, `frontend/app/admin/emails/page.tsx`, `frontend/app/admin/audit/page.tsx`)
- [X] T012 [P] [US1] Audit & prune dead buttons in Company Overview & Operations pages (`frontend/app/company/dashboard/page.tsx`, `frontend/app/company/analytics/page.tsx`, `frontend/app/company/reports/page.tsx`, `frontend/app/company/notifications/page.tsx`, `frontend/app/company/messages/page.tsx`, `frontend/app/company/dispatch/page.tsx`, `frontend/app/company/bookings/page.tsx`, `frontend/app/company/schedule/page.tsx`, `frontend/app/company/staff/page.tsx`)
- [X] T013 [P] [US1] Audit & prune dead buttons in Company Business, Finance & Settings pages (`frontend/app/company/services/page.tsx`, `frontend/app/company/customers/page.tsx`, `frontend/app/company/reviews/page.tsx`, `frontend/app/company/disputes/page.tsx`, `frontend/app/company/wallet/page.tsx`, `frontend/app/company/transactions/page.tsx`, `frontend/app/company/revenue/page.tsx`, `frontend/app/company/commission-rules/page.tsx`, `frontend/app/company/payouts/page.tsx`, `frontend/app/company/settings/page.tsx`)
- [X] T014 [US1] Audit and prune ghost secondary buttons from all drawer footers in `frontend/components/drawers/` to eliminate unhandled clicks per `specs/004-portal-pages-redesign/contracts/button-action-contract.md`

**Checkpoint**: At this point, User Story 1 (MVP) is fully functional and testable independently.

---

## Phase 4: User Story 2 - Monochromatic Quiet-Luxury Page-by-Page Redesign (Priority: P2)

**Goal**: Refactor every page to the quiet-luxury, monochromatic Slate-900 / Slate-950 visual design system, eliminating legacy color clutter.

**Independent Test**: Conduct a systematic visual walkthrough across all 45+ pages; verify cards, tables, headers, and status pills strictly follow the design tokens.

### Implementation for User Story 2

- [X] T015 [P] [US2] Redesign Admin Overview pages (`frontend/app/admin/analytics/page.tsx`, `frontend/app/admin/reports/page.tsx`) with monochromatic stat cards and clean management layout
- [X] T016 [P] [US2] Redesign Admin Operations & Trust pages (`frontend/app/admin/service-areas/page.tsx`, `frontend/app/admin/disputes/page.tsx`, `frontend/app/admin/moderation/page.tsx`, `frontend/app/admin/staff/page.tsx`) with quiet-luxury cards and standardized `StatusPill` ('neutral' | 'success' | 'warning' | 'danger')
- [X] T017 [P] [US2] Redesign Admin Growth & Finance pages (`frontend/app/admin/broadcasts/page.tsx`, `frontend/app/admin/promotions/page.tsx`, `frontend/app/admin/featured/page.tsx`, `frontend/app/admin/refunds/page.tsx`) with quiet-luxury styling and confirmation dialogs
- [X] T018 [P] [US2] Redesign Admin Platform Settings pages (`frontend/app/admin/settings/page.tsx`, `frontend/app/admin/monitoring/page.tsx`, `frontend/app/admin/emails/page.tsx`) with clean tabbed cards and telemetry widgets
- [X] T019 [P] [US2] Redesign Company Overview & Communication pages (`frontend/app/company/analytics/page.tsx`, `frontend/app/company/reports/page.tsx`, `frontend/app/company/notifications/page.tsx`, `frontend/app/company/messages/page.tsx`) with monochromatic charts and clean thread styling
- [X] T020 [P] [US2] Redesign Company Operations & Business pages (`frontend/app/company/schedule/page.tsx`, `frontend/app/company/customers/page.tsx`, `frontend/app/company/reviews/page.tsx`, `frontend/app/company/disputes/page.tsx`) with clean data grids and customer inspection drawers
- [X] T021 [P] [US2] Redesign Company Finance & Settings pages (`frontend/app/company/wallet/page.tsx`, `frontend/app/company/transactions/page.tsx`, `frontend/app/company/revenue/page.tsx`, `frontend/app/company/commission-rules/page.tsx`, `frontend/app/company/payouts/page.tsx`, `frontend/app/company/settings/page.tsx`) with Bakong KHQR cash-out modal and tier rule cards
- [X] T022 [US2] Record exact architectural and visual upgrades for all 45+ pages in `specs/004-portal-pages-redesign/contracts/page-upgrade-ledger.md`

**Checkpoint**: At this point, User Stories 1 AND 2 are both complete and verified.

---

## Phase 5: User Story 3 - Interactive Feedback & Slideover Drawer Completeness (Priority: P3)

**Goal**: Every table row click reveals rich slideover drawer context, and every drawer secondary action triggers functional execution or confirmation.

**Independent Test**: Click rows in each table view; verify slideover drawers open smoothly with record context and functional secondary actions.

### Implementation for User Story 3

- [X] T023 [P] [US3] Wire row click-to-drawer inspection across all Admin tables in `frontend/app/admin/` enforcing Rule 2 verbatim: "Any button specifying open_drawer must have a corresponding drawer state handler and non-empty drawer component bound to the page shell"
- [X] T024 [P] [US3] Wire row click-to-drawer inspection across all Company tables in `frontend/app/company/` binding `setSelectedRecord(row)` on table rows
- [X] T025 [US3] Wire all destructive actions (delete, reject, ban, cancel) to `ConfirmationDialog` before executing per Rule 3 in `frontend/components/ui/` and drawers

**Checkpoint**: All three user stories are now independently functional and fully integrated.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: System-wide automated validation, linting, health checks, and learning synchronization.

- [X] T026 [P] Run automated test suite (`npx vitest run`) ensuring all test suites pass in `frontend/`
- [X] T027 [P] Run ESLint code quality check (`npm run lint`) ensuring 0 errors across the codebase in `frontend/`
- [X] T028 Verify dev server responds 200 OK across both `/admin` and `/company` routes in `frontend/app/`
- [X] T029 Finalize verification and sync learning to Obsidian vault in `D:\AI\Obsidian\AI_Brain_Sync\004_portal_pages_redesign.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — **BLOCKS all user stories**.
- **User Stories (Phases 3–5)**: All depend on Foundational phase completion.
  - Phase 3 (US1 - Zero Dead Buttons): First user story priority (MVP).
  - Phase 4 (US2 - Monochromatic Redesign): Depends on US1 layout cleanup.
  - Phase 5 (US3 - Drawer Interactivity): Completes row-to-drawer binding and destructive action dialogs.
- **Polish (Phase 6)**: Depends on all user story phases being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories.
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) — Operates on pruned button layouts from US1.
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) — Reuses slideover drawers initialized in Phase 2 and styled in Phase 4.

---

## Parallel Opportunities

- **Phase 1**: `T002` can run while ledger format is set in `T001`.
- **Phase 2**: Drawers `T004`, `T005`, `T006` and `EmptyState` `T007` can all be implemented in parallel across separate files.
- **Phase 3**: Page clusters `T008`, `T009`, `T010`, `T011`, `T012`, `T013` can be audited in parallel since they touch separate route files.
- **Phase 4**: Page redesign batches `T015`, `T016`, `T017`, `T018`, `T019`, `T020`, `T021` touch completely separate files and can run in parallel.
- **Phase 5**: Admin tables `T023` and Company tables `T024` can be wired in parallel.
- **Phase 6**: Test suites `T026` and linting `T027` can run in parallel.

---

## Parallel Example: User Story 1

```bash
# Launch parallel dead button audits across separate route folders:
Task: "Audit & prune dead buttons in Admin Overview pages in frontend/app/admin/dashboard/page.tsx, frontend/app/admin/analytics/page.tsx, frontend/app/admin/reports/page.tsx"
Task: "Audit & prune dead buttons in Admin Trust & Operations pages in frontend/app/admin/bookings/page.tsx, frontend/app/admin/service-areas/page.tsx, frontend/app/admin/disputes/page.tsx, frontend/app/admin/moderation/page.tsx, frontend/app/admin/support/page.tsx"
Task: "Audit & prune dead buttons in Company Overview & Operations pages in frontend/app/company/dashboard/page.tsx, frontend/app/company/analytics/page.tsx, frontend/app/company/reports/page.tsx, frontend/app/company/notifications/page.tsx, frontend/app/company/messages/page.tsx"
```

---

## Parallel Example: User Story 2

```bash
# Launch parallel page redesigns across different route subtrees:
Task: "Redesign Admin Overview pages in frontend/app/admin/analytics/page.tsx, frontend/app/admin/reports/page.tsx"
Task: "Redesign Admin Growth & Finance pages in frontend/app/admin/broadcasts/page.tsx, frontend/app/admin/promotions/page.tsx, frontend/app/admin/featured/page.tsx, frontend/app/admin/refunds/page.tsx"
Task: "Redesign Company Finance & Settings pages in frontend/app/company/wallet/page.tsx, frontend/app/company/transactions/page.tsx, frontend/app/company/revenue/page.tsx, frontend/app/company/commission-rules/page.tsx, frontend/app/company/payouts/page.tsx, frontend/app/company/settings/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete **Phase 1: Setup** (`T001` - `T002`).
2. Complete **Phase 2: Foundational** (`T003` - `T007`).
3. Complete **Phase 3: User Story 1** (`T008` - `T014`).
4. **STOP and VALIDATE**: Confirm zero dead buttons and active routing across all 45+ sidebar links.

### Incremental Delivery
1. Foundation ready (Phases 1 & 2) -> Solid action contract & drawer components.
2. Deliver US1 -> Zero dead buttons across the system (MVP achieved!).
3. Deliver US2 -> Monochromatic quiet-luxury redesign applied to all 45+ pages.
4. Deliver US3 -> Full row-to-drawer slideover inspection & destructive confirmation modals.
5. Deliver Polish -> Automated test verification, 0 lint errors, and Obsidian brain synchronization.
