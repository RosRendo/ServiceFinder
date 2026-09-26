# Tasks: ServiceFinder Landing Page Visual & Graphical Upgrade

**Feature**: ServiceFinder Landing Page Visual & Graphical Upgrade  
**Branch**: `003-landing-visual-upgrade`  
**Input**: Requirements from `specs/003-landing-visual-upgrade/spec.md`, design from `specs/003-landing-visual-upgrade/plan.md`, data entities from `specs/003-landing-visual-upgrade/data-model.md`, and contracts from `specs/003-landing-visual-upgrade/contracts/visual-contracts.md`.

---

## Phase 1: Setup (Visual Infrastructure & Asset Foundations)

**Purpose**: High-resolution trade imagery assets, vector map coordinates, and shared visual dictionary tokens.

- [X] T001 Create curated trade imagery assets, vector map landmark coordinates, and Before/After image pairs in `frontend/lib/visual-assets.ts`
- [X] T002 [P] Extend bilingual dictionary in `frontend/lib/landing-dictionary.ts` with visual labels, Phnom Penh district names (Toul Kork, BKK1, Daun Penh, Sen Sok), map route statuses, and Before/After scrubber tags

---

## Phase 2: Foundational (Reusable Visual Widgets)

**Purpose**: Core visual subcomponents that MUST be implemented before user story page integration.

**⚠️ CRITICAL**: No user story integration in `frontend/app/page.tsx` can complete until these visual widgets are built.

- [X] T003 Implement touch-friendly Before/After image scrubber in `frontend/components/landing/BeforeAfterScrubber.tsx` with CSS `clip-path` sliding, touch-action pan-y handling, and responsive dual arrow handles
- [X] T004 [P] Implement dynamic comparative visual bar chart in `frontend/components/landing/ComparativeRevenueChart.tsx` animating relative bar heights between traditional manual dispatch and ServiceFinder OS as team size changes
- [X] T005 [P] Implement illuminated 4-node ecosystem pipeline in `frontend/components/landing/EcosystemPipeline.tsx` with animated signal pulses connecting Homeowner, Cloud Dispatch, Technician GPS, and Company Bank Account

**Checkpoint**: Foundational visual widgets ready — user story component upgrades can begin.

---

## Phase 3: User Story 1 - Rich Visual Hero & Interactive GPS Dispatch Simulation (Priority: P1) 🎯 MVP

**Goal**: Transform the hero section from text blocks into an interactive vector map simulator of Phnom Penh showing live technician GPS routes, transit path pulses, and simulated Bakong KHQR settlement checkmarks.

**Independent Test**: A visitor can load the hero section, view the animated vector map with landmark districts, click between different dispatch routes to see vehicle marker repositioning, and trigger the visual Bakong KHQR checkout modal popover.

### Tests for User Story 1

- [X] T006 [P] [US1] Component test for `DispatchMapSimulator` in `frontend/__tests__/landing/DispatchMapSimulator.test.tsx` verifying route selection, vehicle marker coordinates, and simulated Bakong KHQR checkmark popover

### Implementation for User Story 1

- [X] T007 [P] [US1] Implement stylized Phnom Penh vector map and dispatch simulator in `frontend/components/landing/DispatchMapSimulator.tsx` with district landmarks (Toul Kork, BKK1, Daun Penh, Sen Sok), animated SVG route vectors, ETA countdown badges, and interactive simulated Bakong KHQR settlement popover
- [X] T008 [US1] Upgrade `frontend/components/landing/HeroSection.tsx` to embed `DispatchMapSimulator` as the primary interactive centerpiece alongside live marketplace dispatch speed visual metric rings

**Checkpoint**: User Story 1 is fully functional and testable independently as the visual MVP.

---

## Phase 4: User Story 2 - Trade Photography & High-Impact Visual Category Showcase (Priority: P2)

**Goal**: Elevate service category cards from plain text icons into high-resolution trade photography showcases with embedded Before/After transformation scrubbers.

**Independent Test**: A homeowner can inspect trade categories featuring authentic photography of technicians at work, drag the Before/After scrubber on AC chemical cleaning and room deep cleaning, and observe smooth 60fps image reveals.

### Tests for User Story 2

- [X] T009 [P] [US2] Component test for `BeforeAfterScrubber` in `frontend/__tests__/landing/BeforeAfterScrubber.test.tsx` verifying drag physics and clip-path style calculations

### Implementation for User Story 2

- [X] T010 [US2] Upgrade `frontend/components/landing/CategoryExplorer.tsx` with high-resolution photography, dark gradient overlays (`bg-gradient-to-t from-slate-900/90`), verified trade license seal emblems, and embedded `BeforeAfterScrubber` showcase for AC coil restoration and cleaning

**Checkpoint**: User Stories 1 AND 2 are both operational with rich visual imagery and interactive simulations.

---

## Phase 5: User Story 3 - Visual Revenue Growth Charts & Connected Ecosystem Flow Diagram (Priority: P3)

**Goal**: Equip business owners with dynamic comparative bar charts in the ROI calculator, an illuminated 4-node connected workflow diagram, and graphical trust certificate seals.

**Independent Test**: A business owner adjusts the technician slider to see the comparative bar chart animate in real time, inspects the illuminated 4-step pipeline flow, and views official NBC Bakong KHQR and Ministry trust seals.

### Implementation for User Story 3

- [X] T011 [P] [US3] Upgrade `frontend/components/landing/PartnerRoiCalculator.tsx` with `ComparativeRevenueChart` visually illustrating the +35% revenue boost bar alongside the slider
- [X] T012 [P] [US3] Upgrade `frontend/components/landing/EcosystemTour.tsx` with `EcosystemPipeline` rendering the illuminated 4-node data and payment flow
- [X] T013 [P] [US3] Upgrade `frontend/components/landing/TrustSecurityGuarantee.tsx` and `frontend/components/landing/PaymentCredibility.tsx` with graphical NBC Bakong KHQR seals, Ministry of Commerce licensing emblems, and Escrow Vault badges
- [X] T014 [US3] Integrate all upgraded visual components into `frontend/app/page.tsx` ensuring harmonious layout and 45/55 visual-to-text balance

**Checkpoint**: All three visual user stories are complete and integrated.

---

## Phase 6: Polish & Cross-Cutting Quality Audits

**Purpose**: Visual density audit, responsive touch testing, performance validation, and automated test suite verification.

- [X] T015 Conduct visual density audit in `frontend/app/page.tsx` and `frontend/components/landing/*` verifying 45/55 visual-to-text ratio, zero generic Silicon Valley placeholders, and strict 1px subtle structural borders
- [X] T016 [P] Touch gesture and responsive layout audit across viewports 320px, 768px, 1280px, and 1920px ensuring fluid Before/After scrubber dragging without scrolling interference
- [X] T017 [P] Run automated test suite (`npx vitest run __tests__/landing/`) and ESLint (`npm run lint`) to ensure zero errors or regressions
- [X] T018 Execute end-to-end quickstart validation scenarios per `specs/003-landing-visual-upgrade/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories.
- **User Stories (Phase 3, 4, 5)**: Depend on Foundational (Phase 2) completion.
  - Phase 3 (US1 - MVP) is the core visual priority (Vector Map Hero).
  - Phase 4 (US2) can proceed with trade photography and Before/After scrubber.
  - Phase 5 (US3) integrates comparative charts, illuminated pipeline, and seals.
- **Polish (Phase 6)**: Depends on all user story phases being implemented.

---

## Parallel Execution Opportunities

```bash
# Phase 1 Parallel Setup:
Task T001: Create trade imagery assets and map coordinates in frontend/lib/visual-assets.ts
Task T002: Extend bilingual dictionary in frontend/lib/landing-dictionary.ts

# Phase 2 Parallel Foundational:
Task T003: Implement BeforeAfterScrubber in frontend/components/landing/BeforeAfterScrubber.tsx
Task T004: Implement ComparativeRevenueChart in frontend/components/landing/ComparativeRevenueChart.tsx
Task T005: Implement EcosystemPipeline in frontend/components/landing/EcosystemPipeline.tsx

# Phase 3 (US1) Parallel Implementation:
Task T006: Component test for DispatchMapSimulator in frontend/__tests__/landing/DispatchMapSimulator.test.tsx
Task T007: Implement DispatchMapSimulator in frontend/components/landing/DispatchMapSimulator.tsx

# Phase 4 (US2) Parallel Implementation:
Task T009: Component test for BeforeAfterScrubber in frontend/__tests__/landing/BeforeAfterScrubber.test.tsx
Task T010: Upgrade CategoryExplorer in frontend/components/landing/CategoryExplorer.tsx

# Phase 5 (US3) Parallel Implementation:
Task T011: Upgrade PartnerRoiCalculator in frontend/components/landing/PartnerRoiCalculator.tsx
Task T012: Upgrade EcosystemTour in frontend/components/landing/EcosystemTour.tsx
Task T013: Upgrade TrustSecurityGuarantee and PaymentCredibility
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1: Setup (`visual-assets.ts`, visual dictionary tokens).
2. Complete Phase 2: Foundational widgets (`BeforeAfterScrubber.tsx`, `ComparativeRevenueChart.tsx`, `EcosystemPipeline.tsx`).
3. Complete Phase 3: User Story 1 (`DispatchMapSimulator.tsx` and Hero Section integration).
4. **VALIDATE**: Interactive vector map and simulated Bakong KHQR checkout modal.

### Incremental Visual Delivery
1. Deliver MVP (Interactive Vector Map Hero).
2. Increment 2: Add User Story 2 (Trade Photography & Before/After Scrubber).
3. Increment 3: Add User Story 3 (Comparative Bar Charts, Illuminated Pipeline, Official Trust Seals).
4. Polish: Run touch gesture audits and automated vitest suites.
