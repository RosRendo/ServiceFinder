# Implementation Plan: ServiceFinder Business Promotion & Platform Showcase Landing Page

**Branch**: `002-business-landing-page` | **Date**: 2026-09-25 | **Spec**: [specs/002-business-landing-page/spec.md](file:///d:/FOR%20RENDO%20(ONLY%20)/Personal%20Project/Service_Finder/specs/002-business-landing-page/spec.md)

**Input**: Feature specification from `/specs/002-business-landing-page/spec.md`

---

## Summary

Transform the ServiceFinder root landing page (`frontend/app/page.tsx`) from a monolithic file full of generic Silicon Valley placeholders into an authoritative, modular, anti-slop marketing and conversion engine. The redesigned landing page establishes a dual-sided value proposition:
1. **For Service Companies (B2B)**: An enterprise field service operating system with 3-click smart dispatching, technician GPS routing, and instant payouts via National Bank of Cambodia Bakong KHQR, supported by an interactive Partner Growth & ROI Calculator.
2. **For Homeowners & Clients (B2C)**: A trusted marketplace for on-demand home maintenance (Air Conditioning, Electrical, Plumbing, Cleaning, Handyman) featuring upfront transparent pricing, 100% verified trade licenses, escrow payment protection, and bilingual Khmer/English support.

The implementation decomposes the 1,500-line monolith into 11 focused, reusable components under `frontend/components/landing/`, backed by a typed localization dictionary and verified against WCAG 2.1 AA standards.

---

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.x, Next.js 16.x (App Router)

**Primary Dependencies**: Next.js, React, Tailwind CSS 4, Framer Motion, Lucide React, TanStack React Query, Radix UI

**Storage**: Browser `localStorage` (key: `sf_landing_lang`) for language persistence; URL query parameters for partner registration intent attribution

**Testing**: Vitest + React Testing Library for component and unit tests (`npm run test`), Playwright for E2E validation (`npm run test:e2e`)

**Target Platform**: Responsive Web (Chromium, Firefox, Safari on Mobile & Desktop, viewports 320px to 2560px)

**Project Type**: Next.js Web Application (Client & Server Components)

**Performance Goals**: FCP < 1.2s, LCP < 2.0s, CLS < 0.05 on standard 4G connections; 60fps animations for calculator and tab interactions

**Constraints**:
- Strictly Anti-"AI Slop": No neon gradients, no generic Silicon Valley company logos, 1px subtle structural borders (`border-slate-200` / `border-slate-800`), purposeful contrast.
- Bilingual Layout Safety: Accommodate +15-25% horizontal text expansion in Khmer without clipping or unwanted line breaks.
- WCAG 2.1 AA compliant contrast for all interactive elements in both light and dark backgrounds.

**Scale/Scope**: 1 root page (`frontend/app/page.tsx`), 11 modular components (`frontend/components/landing/*`), 1 typed dictionary (`frontend/lib/landing-dictionary.ts`), contracts, data model, and quickstart documentation.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance Assessment | Status |
| :--- | :--- | :--- |
| **I. Architectural Simplicity & Maintainability** | Replaces a bloated 1,507-line monolithic file with clean, decoupled single-responsibility components in `frontend/components/landing/`. Leverages existing packages without adding new external dependencies. | **PASS** |
| **II. Functional Preservation** | All existing authentication flows (`/auth/login`, `/auth/register`), company dashboards (`/company/*`), and customer links remain intact. No unrelated features or routes are touched. | **PASS** |
| **III. Technology Stack Boundaries** | Adheres strictly to Next.js App Router, React 19, TypeScript, and Tailwind CSS. Does not breach backend or mobile boundaries. | **PASS** |
| **IV. Security, Auth & RBAC** | Landing page is publicly accessible and does not expose sensitive keys, tokens, or customer data. Partner lead capture and registration validate all inputs. | **PASS** |
| **V. Database Migrations & Data Integrity** | No database modifications required. All interactive computations (ROI calculator) and category previews execute client-side or consume existing public endpoints (`/api/categories`, `/api/services`). | **PASS** |
| **VI. Production Readiness & Validation** | Includes comprehensive error handling, graceful fallbacks for slow connections, unit test suites for calculator logic, and WCAG AA accessibility compliance. | **PASS** |

**Gate Result**: **PASS** (Zero constitutional violations).

---

## Project Structure

### Documentation (this feature)

```text
specs/002-business-landing-page/
├── spec.md              # Feature specification
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0 research output
├── data-model.md        # Phase 1 data entities and schemas
├── quickstart.md        # Phase 1 verification and run guide
├── contracts/           # Phase 1 interface and component contracts
│   └── landing-contracts.md
└── checklists/
    └── requirements.md  # Quality verification checklist
```

### Source Code (repository root)

```text
frontend/
├── app/
│   ├── page.tsx                                  # Decomposed, high-impact landing page orchestrator
│   └── layout.tsx                                # Root layout with fonts & metadata
├── components/
│   └── landing/
│       ├── LandingHeader.tsx                     # Sticky navbar with language toggle, nav links & CTA
│       ├── HeroSection.tsx                       # Dual-value proposition hero with real Cambodian trust badges
│       ├── PartnerRoiCalculator.tsx              # Interactive dynamic revenue growth calculator
│       ├── CategoryExplorer.tsx                  # High-density service trade cards (AC, Plumbing, etc.)
│       ├── EcosystemTour.tsx                     # 3-sided interactive walkthrough (Customer, Company, Staff)
│       ├── PaymentCredibility.tsx                # Bakong KHQR, ABA Pay, Wing Bank trust showcase
│       ├── TrustSecurityGuarantee.tsx            # Escrow protection, verified licenses, dispute resolution
│       ├── ComparisonTable.tsx                   # ServiceFinder OS vs. Traditional Manual Dispatch
│       ├── SocialProofStats.tsx                  # Real marketplace metric counters & partner testimonials
│       ├── FaqSection.tsx                        # Bilingual buyer & partner objection handling
│       ├── AppDownloadModal.tsx                  # Android APK / iOS companion download triggers
│       └── LandingFooter.tsx                     # Comprehensive footer with legal & contact info
├── lib/
│   └── landing-dictionary.ts                     # Fully typed Khmer/English translation dictionary
└── __tests__/
    └── landing/
        ├── PartnerRoiCalculator.test.tsx         # Unit tests for revenue calculation formulas
        └── LandingPage.test.tsx                  # Component rendering and language toggle tests
```

**Structure Decision**: Web application component decomposition under `frontend/components/landing/`. This isolates landing page assets from internal dashboard and admin components while ensuring clean reusability and testability.

---

## Complexity Tracking

> *Zero violations detected. No complexity exceptions required.*

| Violation | Why Needed | Simpler Alternative Rejected Because |
| :--- | :--- | :--- |
| *None* | N/A | N/A |
