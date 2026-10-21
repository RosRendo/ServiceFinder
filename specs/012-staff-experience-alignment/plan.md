# Implementation Plan: Staff Experience Alignment & Navigation Audit

**Branch**: `012-staff-experience-alignment` | **Date**: 2026-10-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/012-staff-experience-alignment/spec.md`

---

## Summary

Resolve navigation link discrepancies in the Staff mobile drawer sidebar (`StaffSidebar.tsx`), modernize the visual design of staff screens (`money.tsx`, `me.tsx`, and supporting views) to match the corporate cockpit design standard (pure white cards `#FFFFFF`, hairline borders `#E2E8F0`, deep charcoal `#0F172A`, discrete semantic dots), enforce 120px safe bottom clearance, and preserve all existing on-site job execution workflows (`today.tsx`, milestone tracking, proof-of-work photo uploads, signature sign-off).

---

## Technical Context

**Language/Version**: TypeScript 5.3+, Node.js 20+  
**Primary Dependencies**: React Native 0.74 / Expo SDK 52, Expo Router v3, `@expo/vector-icons`, `expo-image`, `react-native-maps`, `socket.io-client`  
**Storage**: AsyncStorage, backend PostgreSQL via Prisma ORM  
**Target Platform**: iOS & Android (Expo Mobile Client `frontend-expo`)  
**Project Type**: Mobile Application  
**Performance Goals**: Instant 60 FPS transitions, <300ms drawer response, zero navigation route dead-ends  
**Constraints**: Must strictly preserve customer files (`frontend-expo/app/(customer)/**` remains 100% frozen), zero TypeScript compilation errors (`npx tsc --noEmit`)  
**Scale/Scope**: 1 drawer sidebar component, 3 primary tabs (`today`, `money`, `me`), and associated job execution screens.

---

## Constitution Check

*GATE: Must pass before implementation.*

- **I. Architectural Simplicity & Maintainability**: PASS. Uses existing Expo router conventions and unified design tokens.
- **II. Functional Preservation (Non-Destructive Evolution)**: PASS. Preserves all existing job state transitions, GPS polyline calculations, and offline queuing.
- **III. Technology Stack Boundaries**: PASS. Confined to `frontend-expo` mobile client.
- **IV. Security & Role-Based Access Control**: PASS. Respects JWT token and staff role access guards.
- **V. Customer Isolation**: PASS. Zero modifications to customer code.

---

## Project Structure

### Documentation (this feature)

```text
specs/012-staff-experience-alignment/
├── spec.md              # Feature specification
├── plan.md              # This implementation plan
├── research.md          # Phase 0 research & audit findings
├── data-model.md        # Phase 1 data entities & state machine
├── quickstart.md        # Verification & testing guide
├── contracts/
│   └── staff-navigation-contracts.yaml # Navigation mapping contracts
└── checklists/
    └── requirements.md  # Quality validation checklist
```

### Source Code Targets

```text
frontend-expo/
├── components/
│   └── StaffSidebar.tsx                  # Correct dead links & route mappings
└── app/(staff)/
    ├── (tabs)/
    │   ├── today.tsx                     # Live dispatch & on-shift console
    │   ├── money.tsx                     # Modernize tokens, earnings card & 120px clearance
    │   └── me.tsx                        # Modernize profile cards, tokens & 120px clearance
    ├── history.tsx                       # Ensure 120px bottom clearance & cockpit cards
    ├── performance/
    │   └── index.tsx                     # Ensure 120px bottom clearance & cockpit cards
    ├── availability/
    │   └── index.tsx                     # Ensure 120px bottom clearance & cockpit cards
    └── timeoff/
        └── index.tsx                     # Ensure 120px bottom clearance & cockpit cards
```

---

## Implementation Phases

### Phase 1: Navigation Route Repair (`StaffSidebar.tsx`)
- Correct all invalid `NAV_GROUPS` routes to physical target paths.
- Update active route matching logic for tabs (`today`, `money`, `me`) and sub-screens.

### Phase 2: Design Token & Visual Unification (`money.tsx` & `me.tsx`)
- Replace legacy colors (`#0A192F`, `#F7F8FC`, `#00A699`) with corporate cockpit tokens:
  - Background: `#F8FAFC`
  - Cards: Pure White `#FFFFFF` with `#E2E8F0` hairline border
  - Typography: `#0F172A` (Bold headers), `#64748B` (Secondary text)
  - Indicators: Discrete dots (`#059669` Completed, `#D97706` Pending, `#DC2626` Declined)
- Enforce `contentContainerStyle={{ paddingBottom: 120 }}`.

### Phase 3: Supporting Screens Clearance & Consistency
- Review `history.tsx`, `performance/index.tsx`, `availability/index.tsx`, and `timeoff/index.tsx` for consistent `paddingBottom: 120` and cockpit card styling.

### Phase 4: Verification & TypeScript Safety
- Run `npx tsc --noEmit` in `frontend-expo` to confirm 0 compilation errors.
- Confirm zero changes to customer code.
