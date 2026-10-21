# Feature Specification: Company Mobile Command Cockpit & Operational Flow Redesign

**Feature Branch**: `009-company-cockpit-redesign`

**Created**: 2026-10-05

**Status**: Draft

**Input**: User description: "check the company mobile design and flow i need a new one better than this change from dashboard"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Priority Triage & Instant Dispatch Cockpit (Priority: P1) 🎯 MVP

As a service company dispatcher or business operator, I want an executive-grade mobile command cockpit where urgent pending bookings, SLA countdown timers, and immediate dispatch actions are prominently positioned above the fold so that I can triage incoming customer requests in under 2 seconds without scrolling past disjointed cards.

**Why this priority**: When a company receives an on-demand booking, response speed directly affects marketplace conversion, customer satisfaction, and dispatch rank. Placing urgent action items at the top of the dashboard ensures zero missed response windows.

**Independent Test**: Can be tested independently by logging in as a company admin (`admin@company.com`), opening the dashboard, and confirming that incoming urgent/instant bookings appear at the very top of the screen with active SLA countdown badges, payout amounts, and 1-tap Accept/Assign controls.

**Acceptance Scenarios**:

1. **Given** one or more pending bookings in the company queue, **When** the operator opens the mobile dashboard, **Then** an "Urgent Dispatch Queue" appears at the top of the screen displaying customer name, service type, payout value, and a color-graded SLA urgency badge (`<5m`, `12m left`).
2. **Given** an urgent booking card on the dashboard, **When** the operator taps "Accept & Assign", **Then** the streamlined crew allocation modal immediately opens with eligible nearby technicians sorted by availability.
3. **Given** an operator wishing to decline a request, **When** they tap "Decline", **Then** a confirmation prompt allows them to specify a reason or release the booking back to the platform pool without losing dashboard state.
4. **Given** zero pending bookings in the queue, **When** the operator views the dashboard, **Then** a clean, compact "Queue Cleared / Operational Normal" status indicator is displayed instead of taking up excessive screen real estate.

---

### User Story 2 - Unified Financial Health & Cash Reconciliation Bar (Priority: P1)

As a company owner or financial controller, I want a unified, compact financial command bar on the dashboard summarizing available wallet balance, escrow in transit, physical cash held by crew, and today's net revenue so that I can assess company liquidity and cash risk in a single glance.

**Why this priority**: Business owners need to know their immediate cash position and crew unremitted cash risk without digging through multiple accounting submenus. Consolidating this into a sleek command bar eliminates dashboard clutter.

**Independent Test**: Can be tested independently by viewing the financial command bar on the dashboard, verifying accurate synchronization with `/api/company/payouts` and `/api/companies/my-company/metrics`, and executing 1-tap shortcuts for "Withdraw" and "Settle Crew Cash".

**Acceptance Scenarios**:

1. **Given** active company ledger balances, **When** the owner views the dashboard financial section, **Then** four primary metrics are rendered in a sleek, horizontal or compact grid layout: Available Wallet, Escrow Transit, Crew Physical Cash, and Today's Net Revenue.
2. **Given** unremitted physical cash held by field staff exceeding company threshold, **When** the owner views the cash metric, **Then** a visual warning chip highlights the need for remittance with a 1-tap shortcut to the cash reconciliation ledger.
3. **Given** available balance ready for payout, **When** the owner taps "Withdraw", **Then** they are routed directly to the bank payout transfer flow.

---

### User Story 3 - Live Fleet Availability & Pro Quick-Radar (Priority: P2)

As a fleet coordinator, I want a live pro availability strip on the dashboard displaying technicians currently on shift, traveling, on-job, or offline with one-tap communication shortcuts so that I can supervise crew readiness without switching tabs.

**Why this priority**: Dispatchers constantly balance incoming workloads against active crew availability. Having a live fleet pulse right on the cockpit prevents dispatching jobs to offline or overloaded crew members.

**Independent Test**: Can be tested independently by viewing the dashboard fleet strip, confirming live status rings (Online = Green, On-Job = Amber, Offline = Gray), and tapping phone/chat icons to initiate instant contact with a technician.

**Acceptance Scenarios**:

1. **Given** active technicians in the company roster, **When** viewing the dashboard, **Then** a horizontal quick-radar strip shows technician avatars with live pulsing status dots and active job counts.
2. **Given** a technician needing instructions or check-in, **When** the dispatcher taps their avatar or quick-action icon, **Then** a direct communication menu (Call / Chat) opens immediately.
3. **Given** an operator tapping "View Full Fleet", **Then** the application navigates smoothly to the map-based fleet radar in the Staff tab.

---

### User Story 4 - High-Velocity Flow & Fast-Tab Navigation (Priority: P2)

As an active mobile operator, I want seamless, ergonomic transitions between the Cockpit Dashboard, Dispatch Queue (`operations`), Fleet Roster (`staff`), and Finance (`finance`) with synchronized status badges and zero dead ends so that my daily workflow feels cohesive, modern, and rapid.

**Why this priority**: Navigating between dispatching, crew tracking, and finance should feel like an integrated operations suite rather than isolated siloed screens.

**Independent Test**: Can be tested independently by navigating across the bottom navigation bar and dashboard action shortcuts, verifying that badge counts on the tab bar update in real-time when jobs are accepted or completed.

**Acceptance Scenarios**:

1. **Given** incoming urgent bookings, **When** viewing the bottom navigation bar, **Then** the Dispatch tab displays an unread urgency badge counter matching the dashboard queue.
2. **Given** action shortcuts on the dashboard ("New Booking", "Add Crew", "View Analytics"), **When** tapped, **Then** the operator is routed directly to the target workflow with smooth transitions and back-stack integrity.
3. **Given** device refresh or pull-to-refresh, **Then** all dashboard data blocks (urgent queue, fleet pulse, metrics) reload concurrently within 1 second.

---

### Edge Cases

- **Multiple Concurrent Urgent Inbound Bookings**: What happens when 5+ bookings arrive within 5 minutes? The dashboard renders a high-density carousel or prioritized list capped at top 3 most urgent by SLA deadline, with a compact "+N more in Ops Queue" pill.
- **Zero Crew Members Online**: What happens when an urgent job arrives but all technicians are offline? The dashboard displays a high-contrast amber warning badge ("No crew online — Notify on-call staff") with a 1-tap broadcast trigger.
- **Offline / Poor Network Connectivity**: How does the dashboard behave under spotty cellular connectivity? The cockpit caches the latest known state with a subtle "Offline - Showing cached dispatch state" banner and automatically resumes live syncing upon reconnect.
- **Customer UI Complete Isolation**: How is it guaranteed that customer-facing mobile screens remain 100% untouched? All changes are strictly isolated to `frontend-expo/app/(company)/**` and company components; zero changes may be made to `(customer)`.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST replace the current bloated, 935-line `dashboard.tsx` with a modular, executive-grade Command Cockpit optimized for fast mobile operations.
- **FR-002**: Company Dashboard MUST position the Urgent Action SLA Queue at the very top of the scroll view (above all financial and analytical widgets).
- **FR-003**: Each urgent booking card on the dashboard MUST display a live color-graded countdown chip (`<5m` pulsing red alert, `5-15m` amber, `>15m` green), customer name, service category icon, scheduled window, and payout amount.
- **FR-004**: Each urgent booking card MUST feature prominent 1-tap "Accept & Assign" and "Decline" action buttons that execute immediately without opening redundant sub-pages.
- **FR-005**: Dashboard MUST include an Executive Status Header displaying the company name, verified badge, active shift toggle/status, and live operational stats (Online Crew, Active Dispatches, SLA Compliance %).
- **FR-006**: Dashboard MUST consolidate financial data into a unified, high-density Financial Command Bar showing Available Wallet, Escrow Transit, Crew Physical Cash, and Today's Net Revenue.
- **FR-007**: Financial Command Bar MUST provide 1-tap shortcuts for "Withdraw Payout" and "Audit Crew Cash".
- **FR-008**: Dashboard MUST feature a Live Fleet Quick-Radar strip displaying on-shift crew members with pulsing status dots, distance indicators, and 1-tap Call/Chat shortcuts.
- **FR-009**: Dashboard MUST distill or eliminate redundant 2x2 quick-action blocks in favor of compact, contextual action pills.
- **FR-010**: Dashboard MUST distill the weekly revenue chart into a compact sparkline or mini-bar trend card that does not push operational queues below the fold.
- **FR-011**: Bottom navigation tab bar MUST synchronize urgency badge counters with real-time pending bookings.
- **FR-012**: Dashboard MUST adhere to the luxury high-contrast design system (Obsidian Navy `#0A192F` / `#0F172A`, Slate `#F8FAFC`, Emerald `#10B981`, Amber `#F59E0B`, Crimson `#EF4444`).
- **FR-013**: All status indicators MUST enforce dual visual cues (icon + concise label $\le 2$ words) to maintain accessibility in bright sunlight.
- **FR-014**: All customer-facing routes (`app/(customer)/**`) and customer components MUST remain 100% frozen with zero modifications.
- **FR-015**: Dashboard MUST support smooth pull-to-refresh and concurrent data fetching across `/api/companies/my-company`, `/api/companies/my-company/metrics`, and `/api/bookings`.

---

### Key Entities

- **Company Cockpit State**: Real-time aggregated operational snapshot combining active crew availability, dispatch queue urgency, and financial liquidity.
- **Urgent Dispatch Item**: An unassigned or pending booking requiring immediate dispatcher triage with calculated SLA deadline minutes.
- **Fleet Radar Snapshot**: Crew roster status entity containing live availability (`ONLINE`, `ON_JOB`, `OFFLINE`), active workload count, and direct communication handles.
- **Financial Command Ledger**: High-level liquidity snapshot tracking available funds, funds locked in service escrow, unremitted physical cash held by crew, and daily net revenue.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Time to evaluate and respond to an incoming urgent booking from dashboard open is reduced from 15 seconds to under 4 seconds.
- **SC-002**: 100% of urgent action items are visible immediately upon screen load without requiring vertical scrolling on standard smartphone viewports (e.g., iPhone 13/14/15, Pixel 7/8).
- **SC-003**: Vertical code complexity of `dashboard.tsx` is reduced by at least 45% through modular component decomposition (`CompanyCockpitHeader`, `UrgentDispatchCarousel`, `FinancialCommandBar`, `FleetQuickRadar`).
- **SC-004**: Company dispatchers can access crew communication (call or chat) in a single tap directly from the dashboard.
- **SC-005**: 100% of customer screens (`app/(customer)/**`) remain completely unchanged and functionally identical.
- **SC-006**: Zero TypeScript errors (`npx tsc --noEmit`) and 60 fps smooth scroll performance across all mobile viewports.

---

## Assumptions

- Company operators prioritize immediate operational responsiveness and cash risk awareness over historical analytics reports on their mobile devices.
- In-depth multi-year accounting reports and complex staff HR documents belong on the web portal or dedicated tabs, while the mobile dashboard functions as a high-velocity operational command center.
- Existing REST endpoints (`/api/companies/my-company`, `/api/companies/my-company/metrics`, `/api/bookings`, `/api/company/payouts`) provide all necessary data and require no breaking schema changes.
- The customer application workflow is validated, functioning properly, and strictly protected from any regressions.
