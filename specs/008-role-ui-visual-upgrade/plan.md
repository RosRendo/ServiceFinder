# Implementation Plan: Non-Customer Role UI Visual Upgrade & Text Distillation

**Branch**: `008-role-ui-visual-upgrade` | **Date**: 2026-10-05 | **Spec**: [spec.md](./spec.md)

**Input**: User request: *"how about designing is there any replace with design and good visual if there are more text need to be remove to all staff company and admin only dont change anything on customer"*

---

## Summary

Distill non-customer role interfaces (**Staff**, **Company Dispatch**, and **Superadmin**) by stripping wordy explanatory paragraphs, instructions, and text clutter, replacing them with high-glanceability visual indicators:
1. **Field Technician Cockpit (`(staff)`)**: Horizontal 4-stage visual milestone stepper (`En Route` $\rightarrow$ `Arrived` $\rightarrow$ `Working` $\rightarrow$ `Done`), compact action chips, and large-format cash collection ledger meters.
2. **Company Dispatch Hub (`(company)`)**: High-density operational rows with color-graded SLA urgency countdown badges (`<5m`, `5-15m`, `>15m`), live pro radar pulses, and one-tap allocation pills.
3. **Superadmin Console (`(admin)`)**: Visual credential inspection cards with instant verification pills and color-coded SLA timeline bars.
4. **Customer Isolation Boundary**: 100% frozen customer interfaces (`app/(customer)/**` remains completely untouched).

---

## Technical Context

**Language/Version**: TypeScript 5.9, React Native 0.81.5, React 19.1.0  
**Primary Dependencies**: Expo SDK 54, `@expo/vector-icons` (MaterialCommunityIcons, Ionicons), `react-native-reanimated`, `expo-haptics`, `socket.io-client`  
**Storage**: N/A (Client UI presentation layer; consumes existing REST API and WebSocket events)  
**Testing**: Jest (`@testing-library/react-native`), TypeScript strict typecheck (`tsc --noEmit`), Expo manual validation  
**Target Platform**: Mobile (iOS & Android via Expo) & Web runtime preview  
**Project Type**: Mobile Application (`frontend-expo`)  
**Performance Goals**: 60 fps micro-interactions, <2s comprehension time for field job cards and dispatch queue items, zero UI thread blocking during stepper or badge pulse animations  
**Constraints**: Zero modifications to `frontend-expo/app/(customer)/**`; non-metric labels capped at $\le 2$ words; dual-cue accessibility (icon + label) on all status indicators; sunlight-readable contrast ratios ($\ge 4.5:1$)  
**Scale/Scope**: 7 primary screens across 3 non-customer roles (`today.tsx`, `money.tsx`, `operations.tsx`, `staff.tsx`, `finance.tsx`, `companies.tsx`, `queue.tsx`) + 5 reusable visual components  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Requirement | Plan Alignment | Status |
|:---|:---|:---|:---|
| **I. Architectural Simplicity & Maintainability** | Prefer simple, maintainable architecture; follow existing project conventions without adding unnecessary third-party dependencies. | Reuses existing `@expo/vector-icons`, standard React Native `StyleSheet`, and modular components under `components/jobs`, `components/common`, `components/company`, and `components/admin`. | **PASSED** |
| **II. Functional Preservation (Non-Destructive Evolution)** | Preserve existing working functionality across backend, web, and mobile. Never refactor working subsystems outside feature scope. | Zero changes to backend or customer mobile flows. All existing state transitions, socket listeners, and API calls are strictly preserved. | **PASSED** |
| **III. Technology Stack Boundaries** | Adhere to stack boundaries (NestJS, Prisma, Next.js, Expo, Python AI). | Modifications strictly contained within `frontend-expo`. | **PASSED** |
| **IV. Security, Auth & RBAC** | Enforce JWT auth, RBAC guards, protect sensitive credentials and tracking boundaries. | Preserves existing role guards (`RoleGuard`, `StaffSidebar`, `CompanySidebar`, `AdminSidebar`); no token or credential exposure. | **PASSED** |
| **V. Database Migrations & Data Integrity** | Database changes require Prisma migrations; direct edits forbidden. | No database schema modifications needed. Pure UI presentation upgrade. | **PASSED** |
| **VI. Production Readiness, Resilience & Validation** | Graceful error states, type safety, offline handling, dual visual cues. | Preserves existing `NetInfo` and offline queues in `today.tsx`; adds dual visual cues for accessibility; passes strict TypeScript check. | **PASSED** |

**Constitution Gate Result**: **ALL CHECKS PASSED** (No violations or exemptions required).

---

## Project Structure

### Documentation (this feature)

```text
specs/008-role-ui-visual-upgrade/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output: tokens, steppers, radar, text distillation
├── data-model.md        # Phase 1 output: component schemas, state enums, visual tokens
├── quickstart.md        # Phase 1 output: validation scenarios and commands
├── contracts/           # Phase 1 output: component interface contracts
│   └── component-contracts.yaml
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
frontend-expo/
├── app/
│   ├── (admin)/
│   │   └── (tabs)/
│   │       ├── companies.tsx       # Upgrade: visual credential cards + 1-tap verify pills
│   │       └── queue.tsx           # Upgrade: color-graded SLA urgency timeline bars
│   ├── (company)/
│   │   └── (tabs)/
│   │       ├── operations.tsx      # Upgrade: high-density rows, urgency chips, 1-tap assign
│   │       ├── staff.tsx           # Upgrade: pro radar pulses, distance chips, 1-tap call/chat
│   │       └── finance.tsx         # Upgrade: field cash reconciliation table + settle pill
│   ├── (customer)/                 # [FROZEN] STRICTLY UNTOUCHED - ZERO MODIFICATIONS
│   └── (staff)/
│       └── (tabs)/
│           ├── today.tsx           # Upgrade: horizontal milestone stepper, remove paragraphs
│           └── money.tsx           # Upgrade: large-format numbers, visual cash limit meter
└── components/
    ├── admin/
    │   └── CredentialInspectionCard.tsx # New: visual credential preview card
    ├── common/
    │   └── UrgencyBadge.tsx             # New: color-graded SLA countdown badge with pulse
    ├── company/
    │   ├── CashReconciliationCard.tsx   # New: cash remittance balance progress meter
    │   └── ProRadarRow.tsx              # New: technician row with status pulse & quick actions
    └── jobs/
        └── VisualMilestoneStepper.tsx   # New: horizontal 4-stage job progression stepper
```

**Structure Decision**:
- Reusable UI elements are placed into appropriate subdirectories under `frontend-expo/components/` based on domain ownership (`jobs/`, `common/`, `company/`, `admin/`).
- Screen modifications are isolated to the corresponding role tabs under `frontend-expo/app/(staff)/(tabs)`, `frontend-expo/app/(company)/(tabs)`, and `frontend-expo/app/(admin)/(tabs)`.
- `frontend-expo/app/(customer)/**` is explicitly frozen and verified against Git diffs.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|:---|:---|:---|
| *None* | Compliant with all constitutional principles | N/A |
