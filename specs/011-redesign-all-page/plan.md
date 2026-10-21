# Implementation Plan: Enterprise Clean Business Admin Portal Redesign

**Branch**: `011-redesign-all-page` | **Date**: 2026-10-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/011-redesign-all-page/spec.md`

## Summary

Unify and elevate all screens across the Admin mobile application (`frontend-expo/app/(admin)/**`) to an institutional, high-density **Clean Business / Enterprise Standard** matching the visual discipline of the company cockpit. This overhaul eliminates multi-colored candy fills, rainbow icon backgrounds, and decorative gradients, replacing them with a sober monochromatic and charcoal system (`#0F172A` deep slate text/accents, `#64748B` muted uppercase labels, `#E2E8F0` hairline borders, and pure white cards on `#F8FAFC` backgrounds) where saturated color is strictly reserved for operational status signaling (subtle emerald, amber, and crimson dots). All queues, directories, and mediation centers enforce single-axis vertical scrolling via `@shopify/flash-list`, safe bottom clearance (`paddingBottom: 120`), and consistent header/back navigation.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.1.0, React Native 0.81.5, Expo SDK 54  
**Primary Dependencies**: `expo-router`, `@shopify/flash-list`, `react-native-safe-area-context`, `@expo/vector-icons`, `expo-image`  
**Storage**: PostgreSQL (Prisma ORM on backend), Redis, Expo SecureStore  
**Testing**: `npx tsc --noEmit` static type verification, Jest unit/component suites  
**Target Platform**: iOS and Android mobile clients (`frontend-expo`)  
**Project Type**: Mobile Application Client  
**Performance Goals**: 60 FPS smooth scrolling, sub-second screen transitions, instantaneous tab filtering  
**Constraints**: Customer App (`frontend-expo/app/(customer)/**`) 100% frozen; zero hardcoded fallback mock metrics; `paddingBottom: 120` to eliminate floating tab bar overlap; zero candy-colored decorative elements  
**Scale/Scope**: 12+ admin screens across `frontend-expo/app/(admin)/**` and admin components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
| :--- | :--- | :---: |
| **I. Architectural Simplicity** | Standardizes consistent design tokens, reuses existing battle-tested components, and introduces zero unnecessary third-party libraries | Passed |
| **II. Functional Preservation** | Preserves all NestJS REST API contracts, admin mutations, and escrow distribution logic; Customer App remains strictly frozen | Passed |
| **III. Tech Stack Boundaries** | Confined strictly to `frontend-expo/app/(admin)/**` and admin components | Passed |
| **IV. Security & RBAC** | Enforces admin privilege checks; two-step confirmation safeguards platform escrow funds with mandatory audit logging | Passed |
| **V. Data Integrity** | No direct database migrations required; leverages existing validated NestJS REST APIs | Passed |
| **VI. Production Readiness** | Includes comprehensive error boundaries, pull-to-refresh, skeleton loaders, and maintains 0 TypeScript errors | Passed |

## Project Structure

### Documentation (this feature)

```text
specs/011-redesign-all-page/
├── plan.md              # This implementation plan
├── spec.md              # Feature specification
├── research.md          # Architectural research & design decisions
├── data-model.md        # Domain entities, lifecycle states, and validation rules
├── quickstart.md        # End-to-end validation scenarios
├── contracts/           # API and component schemas
│   ├── admin-business-api.yaml
│   └── component-contracts.yaml
├── checklists/
│   └── requirements.md  # Specification quality checklist
└── tasks.md             # Tasks breakdown (generated via /speckit-tasks)
```

### Source Code (repository root)

```text
frontend-expo/
├── app/
│   └── (admin)/
│       ├── (tabs)/
│       │   ├── _layout.tsx      # Admin floating tab bar
│       │   ├── dashboard.tsx    # Sober executive command dashboard
│       │   ├── queue.tsx        # High-density KYC approvals queue
│       │   ├── issues.tsx       # Dispute mediation center
│       │   ├── companies.tsx    # Marketplace company directory ledger
│       │   ├── users.tsx        # Enterprise user directory
│       │   ├── analytics.tsx    # Institutional platform telemetry
│       │   └── settings.tsx     # Central operations & governance hub
│       ├── company/
│       │   └── [id].tsx         # Company audit & credential detail
│       ├── disputes/
│       │   └── [id].tsx         # Dispute case detail & arbitration
│       ├── users/
│       │   └── [id].tsx         # User profile & moderation detail
│       ├── payouts.tsx          # Provider payout batch manager
│       ├── refunds.tsx          # Platform refund ledger (responsive stack)
│       ├── audit.tsx            # System audit logs & trail
│       ├── monitoring.tsx       # Infrastructure telemetry & health
│       ├── moderation.tsx       # Content & user moderation
│       └── compliance.tsx       # Legal compliance tracking
└── components/
    ├── AdminSidebar.tsx         # Executive sliding drawer
    └── admin/
        ├── ExecutiveMetricRibbon.tsx
        ├── SlaAlertMatrix.tsx
        ├── CredentialInspectionCard.tsx
        ├── DisputeResolutionSheet.tsx
        └── ManagementCard.tsx
```

## Complexity Tracking

> No violations of the Constitution. Zero complex patterns or new third-party dependencies introduced.
