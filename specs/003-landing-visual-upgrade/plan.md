# Implementation Plan: ServiceFinder Landing Page Visual & Graphical Upgrade

**Branch**: `003-landing-visual-upgrade` | **Date**: 2026-09-25 | **Spec**: [specs/003-landing-visual-upgrade/spec.md](file:///d:/FOR%20RENDO%20(ONLY%20)/Personal%20Project/Service_Finder/specs/003-landing-visual-upgrade/spec.md)

**Input**: Feature specification from `/specs/003-landing-visual-upgrade/spec.md`

---

## Summary

Dramatically elevate the visual richness and aesthetic impact of the ServiceFinder landing page by shifting from a text-heavy layout to an immersive visual-first experience (45/55 visual-to-text ratio). 

Key visual systems introduced:
1. **Interactive Vector Dispatch Map & GPS Simulator** (`DispatchMapSimulator.tsx`) in the hero section displaying Phnom Penh districts, animated technician routes, and a live Bakong KHQR settlement checkmark simulation.
2. **Interactive Before/After Trade Scrubber** (`BeforeAfterScrubber.tsx`) and high-resolution trade photography across all category cards.
3. **Dynamic Comparative Revenue Bar Chart** (`ComparativeRevenueChart.tsx`) in the Partner ROI Calculator visually illustrating the +35% platform revenue uplift vs. traditional manual dispatch.
4. **Illuminated Connected 4-Node Ecosystem Pipeline** (`EcosystemPipeline.tsx`) with animated signal pulses connecting Homeowner, Cloud Dispatch, Technician GPS, and Company Bank Account.
5. **Authentic Graphical Trust Seals** for National Bank of Cambodia Bakong KHQR, Ministry of Commerce licensing, and Escrow Vault protection.

---

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.x, Next.js 16.x (App Router)

**Primary Dependencies**: Next.js App Router, Tailwind CSS 4, Lucide React, Framer Motion, Radix UI

**Storage**: Browser `localStorage` for language and simulation state

**Testing**: Vitest + React Testing Library for component and unit tests (`npm run test`), Playwright for visual tests

**Target Platform**: Responsive Web (Mobile 320px to Desktop 4K, touch gesture support)

**Project Type**: Next.js Web Application (Client & Server Components)

**Performance Goals**: FCP < 1.2s, LCP < 2.2s, 60fps gesture response on touch scrubber and map route animations

**Constraints**:
- Strictly Anti-"AI Slop": Authentic Cambodian trade context, zero generic Silicon Valley logos, 1px subtle architectural borders (`#E2E8F0`), WCAG 2.1 AA contrast over photographic overlays.
- Touch gesture safety: `touch-action: pan-y` on Before/After scrubbers so vertical page scrolling is never blocked.
- Reduced motion support: `prefers-reduced-motion` fallbacks for all vector animations.

**Scale/Scope**: 5 visual subcomponents created or upgraded under `frontend/components/landing/*`, integrated into `frontend/app/page.tsx`.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance Assessment | Status |
| :--- | :--- | :--- |
| **I. Architectural Simplicity & Maintainability** | Enhances visual richness using pure CSS, SVG vectors, and React state without introducing bloated 3rd-party mapping or charting libraries. | **PASS** |
| **II. Functional Preservation** | All existing business routes (`/auth/register`, `/company/*`, `/services`) and bilingual dictionary bindings remain intact. | **PASS** |
| **III. Technology Stack Boundaries** | Adheres strictly to Next.js App Router, Tailwind CSS, and React 19. | **PASS** |
| **IV. Security, Auth & RBAC** | No external map keys or sensitive credentials exposed. Visual simulations execute entirely client-side. | **PASS** |
| **V. Database Migrations & Data Integrity** | No database modifications required. Pure frontend visual architecture upgrade. | **PASS** |
| **VI. Production Readiness & Validation** | Touch gestures support error boundaries, image fallbacks, and unit tests for slider and map state logic. | **PASS** |

**Gate Result**: **PASS** (Zero constitutional violations).

---

## Project Structure

### Documentation (this feature)

```text
specs/003-landing-visual-upgrade/
├── spec.md              # Feature specification
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0 research output
├── data-model.md        # Phase 1 data entities and schemas
├── quickstart.md        # Phase 1 verification and run guide
├── contracts/           # Phase 1 interface and component contracts
│   └── visual-contracts.md
└── checklists/
    └── requirements.md  # Quality verification checklist
```

### Source Code (repository root)

```text
frontend/
├── app/
│   └── page.tsx                                  # Orchestrator with upgraded visual layout
├── components/
│   └── landing/
│       ├── DispatchMapSimulator.tsx              # Interactive stylized vector map of Phnom Penh with route animations
│       ├── BeforeAfterScrubber.tsx               # Touch-friendly Before/After image comparison scrubber
│       ├── ComparativeRevenueChart.tsx           # Dynamic visual bar chart for the ROI calculator
│       ├── EcosystemPipeline.tsx                 # Connected 4-node illuminated workflow diagram
│       ├── HeroSection.tsx                       # Upgraded with DispatchMapSimulator
│       ├── CategoryExplorer.tsx                  # Upgraded with rich trade photography & Before/After preview
│       ├── PartnerRoiCalculator.tsx              # Upgraded with ComparativeRevenueChart
│       ├── EcosystemTour.tsx                     # Upgraded with EcosystemPipeline
│       ├── PaymentCredibility.tsx                # Upgraded with official NBC Bakong KHQR visual seals
│       └── TrustSecurityGuarantee.tsx            # Upgraded with Ministry seal emblems & Escrow Vault badges
└── __tests__/
    └── landing/
        ├── DispatchMapSimulator.test.tsx         # Component tests for interactive map state
        └── BeforeAfterScrubber.test.tsx          # Component tests for image scrubber drag physics
```

---

## Complexity Tracking

> *Zero violations detected. No complexity exceptions required.*

| Violation | Why Needed | Simpler Alternative Rejected Because |
| :--- | :--- | :--- |
| *None* | N/A | N/A |
