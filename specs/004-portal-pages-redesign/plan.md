# Implementation Plan: Comprehensive Portal Sidebar Audit & Page-by-Page Redesign

**Branch**: `004-portal-pages-redesign` | **Date**: 2026-09-25 | **Spec**: [specs/004-portal-pages-redesign/spec.md](spec.md)

**Input**: Feature specification from `specs/004-portal-pages-redesign/spec.md`

## Summary

Audit all 45+ sidebar navigation routes across Admin and Company portals, systematically redesign legacy pages into the monochromatic quiet-luxury aesthetic (Slate-900 / Slate-950), enforce strict button integrity (zero dead buttons, remove non-functional actions from drawers), and ensure every operator click triggers visible interactive feedback (slideover drawer, modal, or toast).

## Technical Context

**Language/Version**: TypeScript 5.6+, Node.js 20+

**Primary Dependencies**: Next.js 15 (App Router), React 19, Tailwind CSS v4, Lucide React, Sonner / React Hot Toast, Framer Motion

**Storage**: PostgreSQL with Prisma ORM, Redis (for live socket notifications)

**Testing**: Vitest, React Testing Library, ESLint

**Target Platform**: Responsive Web (Admin Portal & Company B2B Portal)

**Project Type**: Next.js Web Application (`frontend/`)

**Performance Goals**: Every interactive click registers in < 100ms; zero layout shifts during drawer expansion.

**Constraints**: Monochromatic Quiet-Luxury design tokens; no multi-color border clutter; zero dead or unlinked buttons.

**Scale/Scope**: ~45 portal pages across Admin and Company portals.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check Item | Status | Justification |
| :--- | :--- | :---: | :--- |
| **I. Architectural Simplicity** | Reuses established `ManagementDataGrid`, `SlideoverDrawer`, and `StatusPill` primitives rather than introducing ad-hoc components. | **PASS** | Strict adherence to existing clean UI tokens. |
| **II. Functional Preservation** | Preserves all working endpoints, queries, and mutations; only replaces dead/dummy controls. | **PASS** | Non-destructive evolution. |
| **III. Tech Stack Boundaries** | Confined strictly to `frontend/app/admin/` and `frontend/app/company/`. | **PASS** | No bleeding across subsystems. |
| **IV. Security & RBAC** | Preserves role-based guards (`admin`, `company_admin`). | **PASS** | Role boundaries respected. |
| **VI. Production Readiness** | All pages must pass linting and vitest tests with 0 errors. | **PASS** | Verified via test automation. |

---

## Project Structure

### Documentation (this feature)

```text
specs/004-portal-pages-redesign/
├── plan.md                                  # This implementation plan
├── research.md                              # Phase 0: Sidebar route audit & dead button analysis
├── data-model.md                            # Phase 1: Action schema, upgrade ledger model
├── quickstart.md                            # Phase 1: Manual and automated verification guide
├── contracts/
│   ├── button-action-contract.md            # Strict click feedback & dead button prohibition rules
│   └── page-upgrade-ledger.md               # Page-by-page transformation tracking ledger
└── checklists/
    └── requirements.md                      # Specification quality validation checklist
```

### Source Code Targets

```text
frontend/
├── app/
│   ├── admin/
│   │   ├── analytics/page.tsx               # Analytics cards & export refactor
│   │   ├── reports/page.tsx                 # Report generator & statement download
│   │   ├── service-areas/page.tsx           # Area coverage table & zone drawer
│   │   ├── disputes/page.tsx                # Dispute resolution board & drawer
│   │   ├── moderation/page.tsx              # Account risk review & suspension modal
│   │   ├── staff/page.tsx                   # Staff assignment & verification drawer
│   │   ├── broadcasts/page.tsx              # Announcement sender & preview modal
│   │   ├── promotions/page.tsx              # Promo code drawer & generator
│   │   ├── featured/page.tsx                # Featured listing priority ranking
│   │   ├── refunds/page.tsx                 # Refund queue & dispute links
│   │   ├── settings/page.tsx                # Tabbed quiet-luxury configuration
│   │   ├── monitoring/page.tsx              # Server telemetry & health card
│   │   └── emails/page.tsx                  # Email template tester & SMTP
│   └── company/
│       ├── analytics/page.tsx               # Revenue velocity & technician KPIs
│       ├── reports/page.tsx                 # Monthly statement generator
│       ├── notifications/page.tsx           # Notification feed with direct jump
│       ├── messages/page.tsx                # Chat interface & job link
│       ├── schedule/page.tsx                # Weekly crew schedule & booking slot
│       ├── customers/page.tsx               # Customer directory & history drawer
│       ├── reviews/page.tsx                 # Rating breakdown & reply drawer
│       ├── disputes/page.tsx                # Dispute response drawer
│       ├── wallet/page.tsx                  # Bakong cash-out & balance card
│       ├── transactions/page.tsx            # Company ledger & commission audit
│       ├── revenue/page.tsx                 # Growth analytics & settled payouts
│       ├── commission-rules/page.tsx        # Commission rule editor drawer
│       ├── payouts/page.tsx                 # Payout history & bank verification
│       └── settings/page.tsx                # Profile & operating hours
└── components/
    ├── admin/                               # Shared admin management components
    ├── company/                             # Shared company management components
    └── drawers/                             # Standardized slideover drawers
```

---

## Phased Implementation Execution

### Phase 0: Route & Button Audit (Completed in `research.md`)
- Mapped all 26 Admin routes and 19 Company routes.
- Identified unlinked buttons, dead drawer triggers, and legacy multi-color UI components.

### Phase 1: Contracts & Architecture (Completed)
- Created `button-action-contract.md` enforcing zero dead buttons and mandatory click feedback.
- Created `page-upgrade-ledger.md` to document every upgraded route and feature.
- Generated `data-model.md` and `quickstart.md`.

### Phase 2: Phased Execution Plan (for `/speckit-tasks` and `/speckit-implement`)
- **Batch 1 (Admin Core & Overview)**: Analytics, Reports, Settings, Monitoring, Emails.
- **Batch 2 (Admin Trust & Marketplace)**: Disputes, Moderation, Staff, Service Areas, Broadcasts, Promotions, Featured, Refunds.
- **Batch 3 (Company Overview & Operations)**: Analytics, Reports, Notifications, Messages, Schedule.
- **Batch 4 (Company Business & Finance)**: Customers, Reviews, Disputes, Wallet, Transactions, Revenue, Commission Rules, Payouts, Settings.
- **Batch 5 (End-to-End Verification)**: Run full test suite, verify zero dead clicks, validate 0 lint errors, check dev server health.
