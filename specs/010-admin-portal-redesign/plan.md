# Implementation Plan: Admin Mobile Cockpit Redesign

**Branch**: `010-admin-portal-redesign` | **Date**: 2026-10-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/010-admin-portal-redesign/spec.md`

## Summary

Modernize the entire Admin mobile experience in `frontend-expo/app/(admin)/**` to the Quiet Luxury / Obsidian Executive standard. The implementation unifies all admin tabs (`dashboard.tsx`, `queue.tsx`, `issues.tsx`, `companies.tsx`, `settings.tsx`, `users.tsx`, `analytics.tsx`) and sub-screens with high-contrast Obsidian cards, replaces awkward horizontal multi-column Kanban sliders with ergonomic segmented filter tabs, enforces safe bottom scroll padding (`paddingBottom: 120`) to eliminate floating tab bar collisions, implements a two-step confirmation safeguard for escrow dispute resolutions, and organizes platform governance tools into a central hub.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.1.0, React Native 0.81.5, Expo SDK 54  
**Primary Dependencies**: `expo-router`, `@shopify/flash-list`, `react-native-safe-area-context`, `@expo/vector-icons`, `expo-image`  
**Storage**: PostgreSQL (Prisma ORM on backend), Redis, Expo SecureStore  
**Testing**: `npx tsc --noEmit` type checking, Jest component tests  
**Target Platform**: iOS and Android mobile clients (`frontend-expo`)  
**Project Type**: Mobile Application Client  
**Performance Goals**: 60 FPS smooth scrolling, sub-second screen transitions, instantaneous tab filtering  
**Constraints**: Customer App (`frontend-expo/app/(customer)/**`) 100% frozen; zero hardcoded mock metrics; `paddingBottom: 120` to avoid floating tab bar overlap  
**Scale/Scope**: 12+ admin screens across `frontend-expo/app/(admin)/**`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
| :--- | :--- | :---: |
| **I. Architectural Simplicity** | Reuses existing design tokens, components (`Theme`, `InitialsAvatar`, `ErrorState`, `CredentialInspectionCard`), avoiding heavy new third-party libraries | Passed |
| **II. Functional Preservation** | Preserves all backend API contracts and admin mutations; customer app remains strictly frozen | Passed |
| **III. Tech Stack Boundaries** | Confined strictly to `frontend-expo/app/(admin)/**` and admin components | Passed |
| **IV. Security & RBAC** | Enforces admin access permissions; two-step confirmation safeguards platform escrow funds | Passed |
| **V. Data Integrity** | No direct database migrations required; consumes existing validated NestJS REST APIs | Passed |
| **VI. Production Readiness** | Comprehensive error boundaries, pull-to-refresh, skeleton loaders, and 0 TypeScript errors | Passed |

## Project Structure

### Documentation (this feature)

```text
specs/010-admin-portal-redesign/
├── plan.md              # Implementation plan (this file)
├── spec.md              # Feature specification
├── research.md          # Phase 0 architectural decisions & UX paradigms
├── data-model.md        # Phase 1 data entities and lifecycle states
├── quickstart.md        # Phase 1 end-to-end validation scenarios
├── contracts/           # API and component schemas
│   ├── admin-cockpit-api.yaml
│   └── component-contracts.yaml
├── checklists/
│   └── requirements.md  # Quality checklist
└── tasks.md             # Phase 2 output (generated via /speckit-tasks)
```

### Source Code (repository root)

```text
frontend-expo/
├── app/
│   └── (admin)/
│       ├── (tabs)/
│       │   ├── _layout.tsx      # Admin floating tab bar
│       │   ├── dashboard.tsx    # Executive cockpit dashboard
│       │   ├── queue.tsx        # Verification queue (segmented tabs)
│       │   ├── issues.tsx       # Dispute mediation center
│       │   ├── companies.tsx    # Marketplace company directory
│       │   ├── users.tsx        # User management directory
│       │   ├── analytics.tsx    # Platform analytics & telemetry
│       │   └── settings.tsx     # Platform operations hub
│       ├── company/
│       │   └── [id].tsx         # Company audit & credential detail
│       ├── disputes/
│       │   └── [id].tsx         # Dispute case detail & mediation
│       ├── users/
│       │   └── [id].tsx         # User profile & moderation detail
│       ├── payouts.tsx          # Provider payout batch manager
│       ├── refunds.tsx          # Platform refund ledger
│       ├── audit.tsx            # System audit logs
│       ├── monitoring.tsx       # Real-time infrastructure health
│       ├── moderation.tsx       # Content & user moderation
│       └── compliance.tsx       # Legal compliance tracking
└── components/
    ├── AdminSidebar.tsx         # Executive sliding admin drawer
    └── admin/
        ├── CredentialInspectionCard.tsx
        └── ManagementCard.tsx
```

## Complexity Tracking

> No violations of the Constitution. Zero complex patterns introduced.
