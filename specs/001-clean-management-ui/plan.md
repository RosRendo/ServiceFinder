# Implementation Plan: Clean Management UI (Company & Admin Refit)

**Branch**: `001-clean-management-ui` | **Date**: 2026-09-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-clean-management-ui/spec.md`

## Summary

This plan executes the end-to-end design and interaction cleanup of the Company and Admin management surfaces across both the Next.js web portal (`frontend/app/admin`, `frontend/app/company`) and the Expo mobile app (`frontend-expo/app/(admin)`, `frontend-expo/app/(company)`). It replaces decorative "AI slop" (cluttered gradients, oversized rainbow badges, filler cards, glowing borders, and disorienting navigation) with an authoritative, high-density, quiet luxury design system (clean DataGrids, slide-over inspection drawers, standard quiet semantic status pills, and fast 1–3 click operator workflows).

---

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+  
**Primary Dependencies**: 
- Web: Next.js 16 (App Router), React 19, Tailwind CSS, Radix UI primitives, Lucide React, TanStack React Query, Sonner.
- Mobile: Expo SDK 54, React Native, `@shopify/flash-list`, `@expo/vector-icons`, Zustand.
**Storage**: PostgreSQL (Prisma ORM) & Redis (unchanged; presentation-tier refit with zero schema migrations).  
**Testing**: Vitest & Playwright (`frontend`), Jest & TypeScript check (`frontend-expo`).  
**Target Platform**: Desktop & Tablet Web Browsers (Chrome, Safari, Firefox, Edge) + Mobile/Tablet (iOS & Android via Expo).  
**Project Type**: Multi-tier Web & Mobile Management Applications.  
**Performance Goals**: <100ms interaction response, zero cumulative layout shift (CLS < 0.05), instant table sorting, sub-second search debounce.  
**Constraints**: Zero destructive changes to existing database schema; preserve all working API contracts; WCAG 2.1 AA color contrast compliance.  
**Scale/Scope**: 
- 27 Admin web routes (`frontend/app/admin/*`)
- 23 Company web routes (`frontend/app/company/*`)
- Admin mobile tabs (`frontend-expo/app/(admin)/*`)
- Company mobile tabs (`frontend-expo/app/(company)/*`)

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Gate | Status | Justification / Mitigation |
| :--- | :---: | :--- |
| **I. Architectural Simplicity & Maintainability** | **PASSED** | Reuses existing Radix UI primitives, Tailwind CSS classes, and established design tokens. No superfluous third-party libraries introduced. |
| **II. Functional Preservation** | **PASSED** | All operational capabilities (dispatching, verifying, editing, refunding, exporting) remain fully functional. Refit is strictly layout, typography, and density enhancement. |
| **III. Technology Stack Boundaries** | **PASSED** | Web interfaces remain strictly within `frontend/` (Next.js), mobile companion interfaces remain strictly within `frontend-expo/`, and APIs remain untouched in `backend-nest/`. |
| **IV. Security, Authentication & Role-Based Access Control** | **PASSED** | Preserves all existing JWT session guards, permission checks, and role boundaries between Platform Superadmins and Company Admins. |
| **V. Database Migrations & Data Integrity** | **PASSED** | Zero database schema changes required. All entities bind to existing Prisma models and REST endpoints. |
| **VI. Production Readiness, Resilience & Validation** | **PASSED** | Standardizes empty states, loading skeletons, responsive breakdowns, and error boundaries across all tables and drawers. |

---

## Project Structure

### Documentation (this feature)

```text
specs/001-clean-management-ui/
├── spec.md                  # Feature Specification
├── plan.md                  # Implementation Plan (this file)
├── research.md              # Phase 0 Architectural Decisions
├── data-model.md            # Phase 1 UI View-Models & State
├── quickstart.md            # Phase 1 Runnable Validation Scenarios
├── checklists/
│   └── requirements.md      # Specification Quality Checklist
└── contracts/
    ├── ui-design-tokens.json    # Canonical Anti-AI-slop tokens
    ├── datagrid-contract.md     # Standard DataGrid Component contract
    └── drawer-contract.md       # Slide-over Inspection Drawer contract
```

### Source Code (affected paths)

```text
# Web Management Portal (Next.js)
frontend/
├── app/
│   ├── admin/               # Platform Superadmin routes
│   │   ├── verification/    # Company & document verification queue
│   │   ├── companies/       # Company directory & 360 profile
│   │   ├── bookings/        # Booking audit & status inspection
│   │   ├── disputes/        # Dispute mediation & escrow release
│   │   ├── payouts/         # Bank payout authorization
│   │   └── ...
│   └── company/             # Company Manager routes
│       ├── bookings/        # Dispatch & job assignment
│       ├── staff/           # Field technician roster & availability
│       ├── services/        # Service catalog & pricing
│       └── ...
└── components/
    ├── admin/               # Admin-specific DataGrids & Drawers
    └── ui/                  # Reusable Radix/Tailwind primitives

# Mobile Management Companion (Expo)
frontend-expo/
├── app/
│   ├── (admin)/             # Mobile Superadmin tabs & screens
│   └── (company)/           # Mobile Company Admin tabs & screens
└── components/
    └── svg/                 # High-contrast SVGs & Icons
```

**Structure Decision**: Standardizes on the `frontend` Next.js directory for web management and `frontend-expo` for mobile companion views. Both consume standardized design tokens and adhere to the DataGrid + Drawer and High-Density Card patterns defined in `research.md`.

---

## Complexity Tracking

> *No constitutional violations detected. All gates passed without exceptions.*

| Violation | Why Needed | Simpler Alternative Rejected Because |
| :--- | :--- | :--- |
| *None* | N/A | N/A |
