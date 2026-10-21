# Research: Company Mobile Command Cockpit & Operational Flow Redesign

**Feature**: `specs/009-company-cockpit-redesign`  
**Date**: 2026-10-05  
**Domain**: Mobile Command Center UI, High-Velocity Dispatch Ergonomics, Component Modularization

---

## 1. Modularization Strategy for Monolithic `dashboard.tsx`

### Decision
Decompose the 935-line monolithic `dashboard.tsx` into 4 focused, reusable subcomponents located under `frontend-expo/components/company/`:

1. **`CompanyCockpitHeader.tsx`**:
   - Executive header displaying company name, verification shield, operational shift status (Online / Offline pulse), and glanceable live metrics (Online Crew, In-Progress Jobs, SLA Health).
2. **`UrgentDispatchCarousel.tsx`**:
   - Positioned at the very top of the scroll view.
   - Renders pending incoming jobs with color-graded `UrgencyBadge` (<5m pulse, 12m), customer avatar, service category, payout chip, and 1-tap "Accept & Assign" / "Decline" buttons.
3. **`FinancialCommandBar.tsx`**:
   - High-density liquidity overview consolidating 4 metrics: Available Wallet Balance, Escrow in Transit, Crew Physical Cash Hold, and Daily Net Revenue.
   - Provides 1-tap action buttons for "Withdraw" and "Audit Crew Cash".
4. **`FleetQuickRadar.tsx`**:
   - Horizontal live crew strip displaying on-shift technicians with pulsing status dots (Online = Green, On-Job = Amber, Offline = Gray), current active job count, and direct 1-tap Call/Chat shortcuts.

### Rationale
- The existing monolithic `dashboard.tsx` suffers from severe cognitive overload and code maintainability issues.
- Splitting into 4 domain-focused components reduces `dashboard.tsx` from 935 lines to ~220 lines (over 75% reduction in monolithic complexity).
- Each component can be independently tested, previewed, and updated without risking regressions in other sections.

### Alternatives Considered
- *Keeping single-file dashboard and just reordering JSX*: Rejected because a 900+ line screen is brittle, difficult to debug, and mixes business logic with multiple unrelated presentation concerns.
- *Removing financial and fleet widgets entirely and only showing dispatch*: Rejected because company owners need a high-level operational pulse (liquidity and crew readiness) alongside dispatch triage.

---

## 2. Top-of-Fold Ergonomics & Information Hierarchy

### Decision
Enforce a strict vertical layout hierarchy:
1. `CompanyCockpitHeader` (Sticky / Compact Top Bar, ~64px)
2. `UrgentDispatchCarousel` (Immediate Top-of-Fold, ~190px)
3. `FinancialCommandBar` (Compact 2x2 or horizontal strip, ~120px)
4. `FleetQuickRadar` (Horizontal crew scroll, ~90px)
5. `RecentActivityFeed` (Collapsible / Compact bottom section)

### Rationale
- Field service operators manage high-velocity queues. Placing the `UrgentDispatchCarousel` immediately below the header ensures operators evaluate and assign new bookings within 2 seconds of launching the app.
- Historical charts and low-priority quick actions are condensed, preventing critical dispatch items from being pushed below the fold.

---

## 3. Real-Time Dispatch Badge & Fast-Tab Synchronization

### Decision
In `frontend-expo/app/(company)/(tabs)/_layout.tsx`:
- Enhance the floating tab bar's `Dispatch` (`operations`) tab to render a dynamic badge pill showing the count of pending unassigned bookings.
- When a booking is accepted or assigned from either the dashboard or the operations tab, the badge counter updates immediately.

### Rationale
- Guarantees that operators navigating in Staff or Finance tabs are immediately notified if a high-priority customer booking enters the queue.

---

## 4. Strict Customer Isolation Boundary

### Decision
Enforce strict git isolation:
- `frontend-expo/app/(customer)/**` remains 100% frozen.
- All modifications are strictly scoped to `frontend-expo/app/(company)/**` and `frontend-expo/components/company/**`.

### Rationale
- Adheres directly to the user directive to preserve customer flows.
