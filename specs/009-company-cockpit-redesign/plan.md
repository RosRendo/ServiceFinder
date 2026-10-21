# Implementation Plan: Company Mobile Command Cockpit & Operational Flow Redesign

**Branch**: `009-company-cockpit-redesign` | **Date**: 2026-10-06 | **Spec**: [specs/009-company-cockpit-redesign/spec.md](file:///d:/FOR%20RENDO%20%28ONLY%20%29/Personal%20Project/Service_Finder/specs/009-company-cockpit-redesign/spec.md)

**Input**: Feature specification from `/specs/009-company-cockpit-redesign/spec.md`

## Summary

The current Company mobile dashboard (`frontend-expo/app/(company)/(tabs)/dashboard.tsx`) is a 935-line monolithic file that mixes conflicting operational concerns (historical charts, wallet cards, today counters, SLA metrics, activity feed, action buttons) and buries urgent pending dispatch jobs below the fold.

This plan executes a comprehensive redesign of the company mobile operational flow:
1. **Decompose the Monolith**: Split `dashboard.tsx` from 935 lines down to $\le 220$ lines by extracting 4 cohesive, reusable subcomponents in `frontend-expo/components/company/`:
   - `CompanyCockpitHeader.tsx`: Executive header with verified shield, operational shift toggle, and glanceable live shift counters (Online Pros, In-Progress, SLA Health).
   - `UrgentDispatchCarousel.tsx`: Immediate top-of-fold priority triage deck rendering incoming bookings with color-graded SLA urgency badges (<5m pulse, 12m) and 1-tap "Accept & Assign" / "Decline" thumb pills.
   - `FinancialCommandBar.tsx`: High-density liquidity strip consolidating Available Balance, Escrow in Transit, Crew Physical Cash Hold, and Daily Net Revenue with 1-tap "Withdraw" and "Audit Cash" triggers.
   - `FleetQuickRadar.tsx`: Horizontal live crew status strip displaying on-shift technicians with pulsing status dots and 1-tap phone/chat shortcuts.
2. **Tab Bar Badge Synchronization**: Update the floating bottom navigation in `frontend-expo/app/(company)/(tabs)/_layout.tsx` to dynamically display pending unassigned booking counts on the `Dispatch` (`operations`) tab.
3. **Strict Boundary Invariants**: Customer mobile screens under `frontend-expo/app/(customer)/**` and customer components remain 100% frozen.

---

## Technical Context

**Language/Version**: TypeScript 5.3+, React Native 0.74+ / Expo SDK 51+  
**Primary Dependencies**: `expo`, `react-native`, `expo-router`, `@expo/vector-icons` (`MaterialCommunityIcons`, `Ionicons`), `lucide-react-native`, `zustand` (auth/store), `axios`  
**Storage**: AsyncStorage (client session & local cache), PostgreSQL via NestJS backend REST APIs  
**Testing**: `npx tsc --noEmit` (static type safety), ESLint, manual scenario-driven visual validation  
**Target Platform**: iOS, Android, and Mobile Web via Expo React Native  
**Project Type**: Mobile Application Client (`frontend-expo`)  
**Performance Goals**: 
- Initial screen render $\le 600\text{ ms}$
- 60 fps smooth horizontal and vertical scrolling
- Top-of-fold dispatch triage response within 2 taps ($\le 2\text{ s}$)
**Constraints**: 
- No new external runtime npm packages
- Line count for `dashboard.tsx` strictly $\le 220$ lines
- `frontend-expo/app/(customer)/**` remains 100% frozen (0 git diff)
**Scale/Scope**: 1 screen refactor (`dashboard.tsx`), 1 layout update (`_layout.tsx`), 4 new modular components in `frontend-expo/components/company/`

---

## Constitution Check

*GATE: Evaluated against `.specify/memory/constitution.md`*

| Principle | Requirement | Status | Verification |
|:---|:---|:---|:---|
| **I. Architectural Simplicity & Maintainability** | Prefer simple, maintainable architecture. Eliminate monolithic file complexity. | **PASSED** | Monolithic 935-line `dashboard.tsx` is broken down into 4 focused subcomponents ($\le 220$ lines for the screen). |
| **II. Functional Preservation** | Preserve working functionality across web, backend, and non-targeted mobile roles. | **PASSED** | Customer app is 100% frozen. Staff and admin visual upgrades from 008 are preserved. Backend APIs are reused without alteration. |
| **III. Technology Stack Boundaries** | Adhere to defined tech stacks (Expo/React Native for mobile). | **PASSED** | Pure React Native/Expo TypeScript components; no foreign frameworks. |
| **IV. Security, Auth & RBAC** | Strict role-based isolation; no sensitive credential leak. | **PASSED** | Company console remains strictly guarded by `RoleGuard` / company session tokens. |
| **V. Database Migrations & Data Integrity** | Non-destructive migrations; no ad-hoc schema changes. | **PASSED** | No database changes required. Uses existing backend booking, staff, and wallet endpoints. |
| **VI. Production Readiness & Resilience** | Loading states, error states, accessibility dual visual cues, zero text paragraphs. | **PASSED** | Pull-to-refresh, skeleton/empty states, dual-cue status chips (icon + $\le 2$-word label), zero explanatory paragraphs. |

---

## Project Structure

### Documentation (this feature)

```text
specs/009-company-cockpit-redesign/
├── checklists/
│   └── requirements.md     # 16/16 requirements verified
├── plan.md                 # This implementation plan
├── research.md             # Phase 0 architectural & modularization decisions
├── data-model.md           # Phase 1 component contracts & schemas
├── quickstart.md           # Phase 1 validation & verification scenarios
├── contracts/
│   └── component-contracts.yaml # Phase 1 component prop contracts
└── tasks.md                # Phase 2 task breakdown (generated via /speckit-tasks)
```

### Source Code (Concrete Implementation Layout)

```text
frontend-expo/
├── app/
│   └── (company)/
│       └── (tabs)/
│           ├── _layout.tsx                     # Floating tab bar: add dynamic pending badge to Dispatch tab
│           ├── dashboard.tsx                   # Refactored command cockpit (<220 lines)
│           ├── operations.tsx                  # Full dispatch operations queue (preserved)
│           ├── staff.tsx                       # Full crew directory & management (preserved)
│           ├── finance.tsx                     # Detailed ledger & payouts (preserved)
│           └── profile.tsx                     # Company settings & verification (preserved)
└── components/
    └── company/
        ├── CompanyCockpitHeader.tsx            # Executive header, shift toggle, live counters
        ├── UrgentDispatchCarousel.tsx          # Top-of-fold priority triage deck with UrgencyBadge
        ├── FinancialCommandBar.tsx             # 4-metric liquidity grid & 1-tap action triggers
        └── FleetQuickRadar.tsx                 # Live technician radar strip with 1-tap call/chat
```

**Structure Decision**:
- Scoped strictly to `frontend-expo/app/(company)` and `frontend-expo/components/company`.
- Monolithic `dashboard.tsx` is reduced from 935 lines by delegating presentation and specialized user interactions to the 4 components.
- Zero touch on `frontend-expo/app/(customer)/**`.

---

## Complexity Tracking

> **Constitution Check passed with zero violations.** No complexity exemptions or anti-pattern waivers required.
