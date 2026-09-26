# Tasks: ServiceFinder Business Promotion & Platform Showcase Landing Page

**Feature**: ServiceFinder Business Promotion & Platform Showcase Landing Page  
**Branch**: `002-business-landing-page`  
**Input**: Requirements from `specs/002-business-landing-page/spec.md`, design from `specs/002-business-landing-page/plan.md`, data entities from `specs/002-business-landing-page/data-model.md`, and contracts from `specs/002-business-landing-page/contracts/landing-contracts.md`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, directory structure, and shared localization tokens.

- [X] T001 Create landing page components directory at `frontend/components/landing/`
- [X] T002 [P] Create typed bilingual Khmer/English translation dictionary in `frontend/lib/landing-dictionary.ts` with complete schemas for `nav`, `hero`, `calculator`, `categories`, `ecosystem`, `payments`, `trust`, `comparison`, `socialProof`, `faq`, and `footer`
- [X] T003 [P] Configure Khmer font typography cascades (`--font-suwannaphum`) and text expansion tolerance utilities (+20% width flex-wrapping) in `frontend/app/globals.css`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core layout shell and navigation components that MUST be complete before user stories can be integrated.

**⚠️ CRITICAL**: No user story integration in `frontend/app/page.tsx` can complete until this phase is finished.

- [X] T004 Create sticky landing navigation header in `frontend/components/landing/LandingHeader.tsx` featuring brand logo, section anchors ("For Businesses", "Services", "How it Works", "Trust"), bilingual language toggle (`kh` / `en`), and "Register Business" CTA
- [X] T005 [P] Create landing page footer in `frontend/components/landing/LandingFooter.tsx` featuring localized company links, Bakong KHQR verification badge, Ministry licensing mention, and copyright info
- [X] T006 [P] Create companion mobile app download modal in `frontend/components/landing/AppDownloadModal.tsx` rendering authentic Android APK and iOS TestFlight install options with QR codes

**Checkpoint**: Shared shell and navigation ready — user story component implementation can begin.

---

## Phase 3: User Story 1 - Prospective Service Company Partner Discovery & Onboarding (Priority: P1) 🎯 MVP

**Goal**: Empower prospective service business owners to evaluate the ServiceFinder operating system, simulate revenue growth via an interactive ROI calculator, review B2B operational comparisons, and navigate to partner registration with pre-populated intent.

**Independent Test**: A prospective business owner can load the landing page, view the B2B hero value proposition, adjust the technician slider in `PartnerRoiCalculator` from 1 to 50 staff, observe instantaneous updates to monthly capacity and gross revenue, inspect the comparison table, and click "Register Your Business" which routes directly to `/auth/register?role=company_admin&teamSize=${teamSize}&intent=partner`.

### Tests for User Story 1

- [X] T007 [P] [US1] Unit test for Partner Growth Calculator formulas in `frontend/__tests__/landing/PartnerRoiCalculator.test.tsx` verifying:
  - `monthlyJobCapacity = Math.round(teamSize * jobsPerDayPerTech * workDaysPerMonth)` (with teamSize: 5, jobs: 3.5, days: 26 -> 455 jobs)
  - `monthlyGrossRevenue = Math.round(monthlyJobCapacity * averageTicketUsd)` (with ticket: $45 -> $20,475)
  - `estimatedNetGrowth = Math.round(monthlyGrossRevenue * 0.35)` (+$7,166/mo)
  - `annualRevenueUplift = estimatedNetGrowth * 12` ($85,992/yr)

### Implementation for User Story 1

- [X] T008 [P] [US1] Implement dynamic reactive Partner ROI Growth Calculator in `frontend/components/landing/PartnerRoiCalculator.tsx` with:
  - Slider for `teamSize`: `"Min: 1, Max: 50, Step: 1, Default: 5"`
  - Default constraints: `averageTicketUsd: 45.0`, `jobsPerDayPerTech: 3.5`, `workDaysPerMonth: 26`
  - Tabular numeric displays for `monthlyJobCapacity`, `monthlyGrossRevenue`, `estimatedNetGrowth`, and `annualRevenueUplift`
  - Conversion button navigating to `/auth/register?role=company_admin&ref=landing_calculator&teamSize=${teamSize}`
- [X] T009 [P] [US1] Implement B2B Comparison Table in `frontend/components/landing/ComparisonTable.tsx` contrasting ServiceFinder automated dispatching, verified customer pipeline, and Bakong KHQR instant payouts against traditional unorganized offline operations
- [X] T010 [US1] Implement dual-sided Hero Section in `frontend/components/landing/HeroSection.tsx` highlighting instant field dispatching, zero upfront software costs, and primary partner onboarding CTAs
- [X] T011 [US1] Integrate User Story 1 components (`LandingHeader`, `HeroSection`, `PartnerRoiCalculator`, `ComparisonTable`, `LandingFooter`) into `frontend/app/page.tsx` replacing legacy Silicon Valley placeholders

**Checkpoint**: User Story 1 is fully functional and testable independently as the MVP milestone.

---

## Phase 4: User Story 2 - Consumer Homeowner Service Discovery & Trust Building (Priority: P2)

**Goal**: Deliver instant credibility, transparent baseline pricing, and seamless service discovery for homeowners needing immediate home trade repairs.

**Independent Test**: A homeowner can browse popular service categories (Air Conditioning, Electrical, Plumbing, Cleaning, Handyman), see transparent baseline starting prices (e.g. $15.00), review verified trade license guarantees and escrow protection, and click through to `/services?category=${slug}` without dead links.

### Tests for User Story 2

- [X] T012 [P] [US2] Component test for Category Explorer in `frontend/__tests__/landing/CategoryExplorer.test.tsx` verifying category slug routing and bilingual rendering

### Implementation for User Story 2

- [X] T013 [P] [US2] Implement high-density trade category exploration cards in `frontend/components/landing/CategoryExplorer.tsx` featuring Air Conditioning (`Wind`), Electrical (`Zap`), Plumbing (`Droplet`), Cleaning (`Sparkles`), and Handyman (`Wrench`) with baseline starting prices and verified technician counters linking to `/services?category=${slug}`
- [X] T014 [P] [US2] Implement Trust, Security & Verification Guarantee section in `frontend/components/landing/TrustSecurityGuarantee.tsx` featuring 100% verified trade licenses, escrow payment protection, dispute mediation guarantees, and background-checked technicians
- [X] T015 [US2] Wire Consumer Search bar and Category Explorer into `frontend/app/page.tsx` directly beneath the Hero section with seamless navigation to `/services`

**Checkpoint**: User Stories 1 AND 2 are both operational and independently testable.

---

## Phase 5: User Story 3 - Interactive Ecosystem Walkthrough & Khmer/English Resonance (Priority: P3)

**Goal**: Provide prospective users with an interactive 3-sided ecosystem walkthrough (Customer, Company Admin, Field Staff), local Cambodian payment rail credibility, real-time marketplace counters, and frictionless bilingual toggling.

**Independent Test**: A visitor can switch languages between Khmer (ភាសាខ្មែរ) and English with instantaneous text updates and zero layout shifts, interact with all 3 ecosystem stakeholder tabs with device previews, and verify authentic Bakong KHQR, ABA Pay, and Wing Bank payment badges.

### Tests for User Story 3

- [X] T016 [P] [US3] Component test for Ecosystem Tour in `frontend/__tests__/landing/EcosystemTour.test.tsx` verifying tab switching between `"customer"`, `"company"`, and `"staff"`

### Implementation for User Story 3

- [X] T017 [P] [US3] Implement interactive 3-Way Ecosystem Tour in `frontend/components/landing/EcosystemTour.tsx` with synchronized tabs and device frame previews for Customer (Mobile booking), Company Admin (Web dispatching kanban), and Field Technician (Mobile companion app)
- [X] T018 [P] [US3] Implement Cambodian Fintech Credibility section in `frontend/components/landing/PaymentCredibility.tsx` showcasing National Bank of Cambodia Bakong KHQR, ABA Pay, and Wing Bank instant payout rails
- [X] T019 [P] [US3] Implement Social Proof & Real-time Marketplace Counters in `frontend/components/landing/SocialProofStats.tsx` with animated counters for completed jobs, verified providers, and Cambodian partner testimonials
- [X] T020 [P] [US3] Implement bilingual FAQ accordion in `frontend/components/landing/FaqSection.tsx` with categorized buyer and partner objection handling
- [X] T021 [US3] Wire global language state persistence via `localStorage` (`sf_landing_lang`) and synchronize across all sections in `frontend/app/page.tsx`

**Checkpoint**: All three user stories are complete, integrated, and functioning harmoniously.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Visual quality verification, performance optimizations, accessibility compliance, and end-to-end audit.

- [X] T022 Conduct Anti-"AI Slop" visual audit in `frontend/app/page.tsx` and `frontend/components/landing/*` ensuring 100% elimination of fake foreign logos, strict 1px subtle structural borders (`border-slate-200` / `border-slate-800`), and zero blurry neon gradients
- [X] T023 [P] Responsive layout audit across viewports 320px, 768px, 1280px, and 1920px ensuring zero horizontal overflow and proper Khmer text expansion wrapping
- [X] T024 [P] Run automated test suite (`npx vitest run __tests__/landing/`) and ESLint (`npm run lint`) to ensure zero errors or regressions
- [X] T025 Execute end-to-end quickstart validation scenarios per `specs/002-business-landing-page/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories.
- **User Stories (Phase 3, 4, 5)**: Depend on Foundational (Phase 2) completion.
  - Phase 3 (US1 - MVP) is the core priority.
  - Phase 4 (US2) can run in parallel with or sequentially after US1.
  - Phase 5 (US3) builds upon the layout established in US1 and US2.
- **Polish (Phase 6)**: Depends on all user story phases being implemented.

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Phase 1 & 2. Delivers the core B2B Partner discovery, ROI calculator, and comparison table.
- **User Story 2 (P2)**: Depends on Phase 1 & 2. Delivers consumer category explorer and trust pillars.
- **User Story 3 (P3)**: Depends on Phase 1 & 2. Delivers ecosystem tour, payment rails, social proof, and full bilingual sync.

---

## Parallel Execution Opportunities

```bash
# Phase 1 Parallel Setup:
Task T002: Create typed bilingual dictionary in frontend/lib/landing-dictionary.ts
Task T003: Configure Khmer font typography in frontend/app/globals.css

# Phase 2 Parallel Foundational:
Task T005: Create landing footer in frontend/components/landing/LandingFooter.tsx
Task T006: Create app download modal in frontend/components/landing/AppDownloadModal.tsx

# Phase 3 (US1) Parallel Implementation:
Task T007: Unit test for ROI calculator in frontend/__tests__/landing/PartnerRoiCalculator.test.tsx
Task T008: Implement PartnerRoiCalculator in frontend/components/landing/PartnerRoiCalculator.tsx
Task T009: Implement ComparisonTable in frontend/components/landing/ComparisonTable.tsx

# Phase 4 (US2) Parallel Implementation:
Task T012: Component test for CategoryExplorer in frontend/__tests__/landing/CategoryExplorer.test.tsx
Task T013: Implement CategoryExplorer in frontend/components/landing/CategoryExplorer.tsx
Task T014: Implement TrustSecurityGuarantee in frontend/components/landing/TrustSecurityGuarantee.tsx

# Phase 5 (US3) Parallel Implementation:
Task T016: Component test for EcosystemTour in frontend/__tests__/landing/EcosystemTour.test.tsx
Task T017: Implement EcosystemTour in frontend/components/landing/EcosystemTour.tsx
Task T018: Implement PaymentCredibility in frontend/components/landing/PaymentCredibility.tsx
Task T019: Implement SocialProofStats in frontend/components/landing/SocialProofStats.tsx
Task T020: Implement FaqSection in frontend/components/landing/FaqSection.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1: Setup (`frontend/components/landing/`, `landing-dictionary.ts`, font styles).
2. Complete Phase 2: Foundational (`LandingHeader.tsx`, `LandingFooter.tsx`, `AppDownloadModal.tsx`).
3. Complete Phase 3: User Story 1 (`PartnerRoiCalculator.tsx`, `ComparisonTable.tsx`, `HeroSection.tsx`).
4. **STOP and VALIDATE**: Test calculator reactive formulas and partner registration routing.

### Incremental Delivery
1. Deliver MVP (B2B Partner Discovery & Growth Calculator).
2. Increment 2: Add User Story 2 (Consumer Service Discovery & Trust Guarantees).
3. Increment 3: Add User Story 3 (3-Way Ecosystem Tour, Bakong KHQR rails, bilingual persistence).
4. Polish & Audit: Run Anti-AI-slop visual check and automated test suites.
