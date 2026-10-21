# Implementation Plan: Role Flow Hierarchy Validation & Optimization

**Branch**: `007-role-flow-hierarchy` | **Date**: 2026-10-05 | **Spec**: [specs/007-role-flow-hierarchy/spec.md](file:///d:/FOR%20RENDO%20(ONLY%20)/Personal%20Project/Service_Finder/specs/007-role-flow-hierarchy/spec.md)

**Input**: Feature specification from `/specs/007-role-flow-hierarchy/spec.md`

## Summary

Establish streamlined, high-ergonomics operational workflows and physical navigation isolation across all three non-customer roles:
1. **Field Staff / Technician (`staff`)**: Rapid 1-tap milestone progression (`confirmed` $\rightarrow$ `en_route` $\rightarrow$ `arrived` $\rightarrow$ `in_progress` $\rightarrow$ `completed`), turn-by-turn navigation deep links, proof-of-work photo uploads, offline milestone queueing, and cash collection ledger tracking.
2. **Company Admin / Dispatcher (`company`)**: Instant unassigned booking queue, 1-tap pro allocation modal with proximity/workload sorting, live pro radar, and technician cash reconciliation audit.
3. **Platform Superadmin (`admin`)**: Onboarding company credential vetting, global dispatch SLA queue monitoring, and dispute arbitration with escrow controls.

## Technical Context

**Language/Version**: TypeScript 5.3+, Node.js 20 LTS  
**Primary Dependencies**: Expo SDK 51+, React Native 0.74+, NestJS 10.x, Prisma ORM 5.x, Zustand (client state), Lucide React Native  
**Storage**: PostgreSQL 16 (relational persistence), Redis (caching and pub/sub for real-time dispatch)  
**Testing**: Jest (unit/integration), Supertest (REST endpoints)  
**Target Platform**: Mobile iOS/Android (`frontend-expo`), Web Dashboard (`frontend`), Node Server (`backend-nest`)  
**Project Type**: Multi-role on-demand marketplace client & backend API  
**Performance Goals**: Status update propagation <2s across all connected clients; pro allocation in under 30s; pro navigation launched in under 2 taps from app launch  
**Constraints**: Spotty mobile connectivity handled via offline optimistic milestone queueing; physical cash-on-delivery tracking enforced without balance leaks; strict role isolation without tab state contamination  
**Scale/Scope**: 3 non-customer operational workspaces (Staff, Company, Admin), 14 functional requirements (`FR-001` - `FR-014`), and 6 success criteria (`SC-001` - `SC-006`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

- [x] **Principle I: Architectural Simplicity & Maintainability**: Leverages established Expo file-system route groups and NestJS module controllers (`BookingsController`, `CompaniesController`, `AdminController`). No unnecessary abstractions or new third-party dependencies introduced.
- [x] **Principle II: Functional Preservation**: Non-destructive to existing customer direct booking and search engines. Preserves working endpoints and schemas.
- [x] **Principle III: Technology Stack Boundaries**: Adheres strictly to NestJS backend, Expo mobile client, Next.js web frontend, and Prisma ORM.
- [x] **Principle IV: Security, Authentication & Role-Based Access Control**: Strict role boundary enforcement via `JwtAuthGuard` and `RolesGuard`. Role workspaces isolated in client routing.
- [x] **Principle V: Database Migrations & Data Integrity**: Fully aligned with existing Prisma data models (`Booking`, `CompanyStaff`, `Company`, `Dispute`, `Payment`). No destructive schema changes.
- [x] **Principle VI: Production Readiness, Resilience & Validation**: Includes offline queue resilience for staff, clear loading states, error boundaries, and end-to-end quickstart validation scenarios.

*Result*: **PASSED**. No constitutional violations.

## Project Structure

### Documentation (this feature)

```text
specs/007-role-flow-hierarchy/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan (this file)
├── research.md          # Phase 0: Technical decisions and research
├── data-model.md        # Phase 1: Entity definitions and state machine
├── quickstart.md        # Phase 1: End-to-end runnable validation guide
├── contracts/           # Phase 1: OpenAPI service contracts
│   ├── staff-api.yaml
│   ├── company-api.yaml
│   └── admin-api.yaml
└── checklists/
    └── requirements.md  # Spec quality validation checklist
```

### Source Code Layout

```text
backend-nest/src/
├── bookings/
│   ├── bookings.controller.ts    # Staff assignment, status milestones (en-route, arrive, start, complete)
│   ├── bookings.service.ts       # Booking lifecycle business logic, earnings distribution, photo upload
│   └── dto/booking-actions.dto.ts
├── companies/
│   ├── companies.controller.ts   # Company dashboard metrics, staff roster, revenue ledger
│   └── companies.service.ts
└── admin/
    ├── admin.controller.ts       # Company vetting, dispute arbitration, queue monitor
    └── admin.service.ts

frontend-expo/
├── app/
│   ├── _layout.tsx               # Root role gate & switcher
│   ├── (staff)/                  # Field Technician Workspace
│   │   ├── _layout.tsx           # Stack wrapper
│   │   └── (tabs)/
│   │       ├── today.tsx         # Daily itinerary, 1-tap milestone progression, cash collection
│   │       ├── money.tsx         # Earnings summary, unremitted cash balance
│   │       └── me.tsx            # Shift toggle, profile, skills
│   ├── (company)/                # Company Dispatcher Workspace
│   │   ├── _layout.tsx           # Stack wrapper
│   │   └── (tabs)/
│   │       ├── dashboard.tsx     # KPIs, live dispatch radar
│   │       ├── operations.tsx    # Dispatch board, 1-tap assign pro modal
│   │       ├── staff.tsx         # Crew roster, active statuses
│   │       └── finance.tsx       # Financial ledger & pro cash audit
│   └── (admin)/                  # Platform Governance Workspace
│       ├── _layout.tsx           # Stack wrapper
│       └── (tabs)/
│           ├── dashboard.tsx     # Platform GMV & health
│           ├── queue.tsx         # Real-time dispatch SLA queue monitor
│           ├── companies.tsx     # Company credential vetting & verification
│           └── issues.tsx        # Dispute arbitration & escrow refunds
└── store/
    ├── staffStore.ts             # Pro shift state, daily active booking, offline queue
    ├── companyStore.ts           # Dispatch queue state, roster status
    └── adminStore.ts             # Vetting queue, dispute docket
```

**Structure Decision**: Fully unified monorepo arrangement utilizing existing Expo file-based groups for physical role separation and NestJS modular controllers for role-scoped APIs.

## Complexity Tracking

*No constitutional violations. Zero complexity penalties incurred.*
