# Feature Specification: Staff Experience Alignment & Navigation Audit

**Feature Branch**: `012-staff-experience-alignment`

**Created**: 2026-10-06

**Status**: Draft

**Input**: User description: "now check the staff any update?"

---

## Executive Summary & Audit Findings

An operational and technical audit of the **Staff Mobile Application** (`frontend-expo/app/(staff)/**`) identified key areas requiring alignment with the newly established platform standards:

1. **Navigation Link Discrepancies**:
   - `StaffSidebar.tsx` currently contains dead links referencing nonexistent tab routes (`/(staff)/(tabs)/dashboard`, `/(staff)/(tabs)/schedule`, `/(staff)/(tabs)/messages`, `/(staff)/(tabs)/wallet`, `/(staff)/(tabs)/profile`).
   - The actual tab structure is:
     - `/(staff)/(tabs)/today` (Shift Dispatch & Live Map)
     - `/(staff)/(tabs)/money` (Earnings, Tips & Payout Balance)
     - `/(staff)/(tabs)/me` (Staff Profile & Settings)
     - Dedicated auxiliary routes: `/(staff)/availability`, `/(staff)/timeoff`, `/(staff)/history`, `/(staff)/performance`, `/(staff)/messages/new`.

2. **Visual Hierarchy & Corporate Cockpit System Alignment**:
   - The Admin and Company portals have adopted the corporate cockpit design standard: Pure White Cards (`#FFFFFF`), Hairline Borders (`#E2E8F0`), Deep Charcoal Typography & CTAs (`#0F172A`), Slate Secondary Text (`#64748B`), and Discrete Semantic Dots.
   - Several Staff sub-screens (`me.tsx`, `money.tsx`, `job/[id]/index.tsx`) retain legacy custom color maps (`#0A192F`, `#F7F8FC`, `#00A699`, `#E31C5F`) and inconsistent card corner radii that need modernization.

3. **Mobile Safe Clearance**:
   - While `today.tsx` has fluid map drawers, screens like `money.tsx` and `me.tsx` require standard `paddingBottom: 120` to prevent floating navigation bar overlap.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Flawless Field Navigation & Sidebar Routing (Priority: P1)

As an on-field service technician, I want all sidebar menu items and tab routes to direct to the correct, existing operational screens without navigation errors or 404 dead ends, so that I can access my shift schedule, earnings, and availability immediately.

**Why this priority**: Navigation integrity is fundamental. If a field worker taps "Schedule" or "Wallet" and lands on a broken route or empty screen, they cannot perform their daily responsibilities.

**Independent Test**:
- Open the drawer sidebar in the Staff app.
- Tap every item: `Dashboard` -> routes to `Today`; `Schedule` -> routes to `Availability`; `Wallet` -> routes to `Money`; `Profile` -> routes to `Me`; `Messages` -> routes to `Chat/Messages`.
- Verify zero router warnings or fallback blank screens.

**Acceptance Scenarios**:
1. **Given** a technician is on any staff screen, **When** they open the drawer menu and select "Schedule", **Then** the application navigates directly to `/(staff)/availability`.
2. **Given** a technician taps "Wallet", **When** the menu handles the press, **Then** the application navigates smoothly to `/(staff)/(tabs)/money`.
3. **Given** a technician taps "Dashboard", **When** the navigation executes, **Then** they land on their primary dispatch console at `/(staff)/(tabs)/today`.

---

### User Story 2 - Corporate Cockpit Aesthetic & Unified Field Tokens (Priority: P1)

As an on-field technician working outdoors in varying lighting conditions, I want high-contrast, clean white cards, hairline borders, discrete semantic indicator dots, and legible charcoal typography, so that I can inspect job parameters and client details quickly at a glance.

**Why this priority**: Visual clarity and unified design across all roles ensures the application feels enterprise-grade and reduces cognitive strain for technicians operating in high-stress field conditions.

**Independent Test**:
- Inspect `(tabs)/today`, `(tabs)/money`, and `(tabs)/me`.
- Verify background is consistent `#F8FAFC`, cards are `#FFFFFF` with `#E2E8F0` borders, text is `#0F172A` / `#64748B`, and safe bottom padding of `120px` prevents tab bar collision.

**Acceptance Scenarios**:
1. **Given** a technician opens `Money` or `Profile`, **Then** the UI displays high-contrast white cards with hairline `#E2E8F0` borders and zero playful rainbow pill fills.
2. **Given** a technician scrolls to the bottom of any list, **Then** all actionable buttons and content clear the floating tab bar with `paddingBottom: 120`.

---

### User Story 3 - On-Site Execution Checklist & Proof of Work Capture (Priority: P2)

As a technician at a customer's location, I want a reliable step-by-step milestone stepper with before/after photo documentation and customer signature sign-off, so that my company dispatcher and the customer can verify job completion in real time.

**Why this priority**: Validated proof of work protects both the technician and the service provider from customer chargebacks and escrow disputes.

**Independent Test**:
- Open an active job in `job/[id]/execution.tsx` and `job/[id]/complete.tsx`.
- Walk through "Arrived", "Work in Progress", upload before/after photos, collect customer signature, and swipe to finish.
- Verify status synchronizes with the backend booking state.

**Acceptance Scenarios**:
1. **Given** a technician arrives on site, **When** they tap "Arrived", **Then** the customer receives a real-time notification and the job state transitions to `ARRIVED`.
2. **Given** work is completed, **When** before/after photos and client signature are submitted, **Then** the booking updates to `completed` and unlocks technician earnings.

---

### User Story 4 - Real-Time Shift Earnings & Tip Reconciliation (Priority: P2)

As a field technician, I want a transparent daily and weekly earnings ledger with completed trip counts and tip reconciliation, so that I have complete confidence in my compensation.

**Why this priority**: Wage transparency drives technician engagement and prevents retention issues.

**Independent Test**:
- Navigate to `(tabs)/money.tsx`.
- Switch between "Today" and "Weekly" views.
- Verify earnings amounts match completed booking payouts from `api/staff/performance`.

**Acceptance Scenarios**:
1. **Given** a technician finishes a job with commission earnings, **When** they check the `Money` tab, **Then** their daily earnings card increments immediately.
2. **Given** a technician views their 7-day velocity chart, **Then** bars reflect daily completed job revenue accurately.

---

## Edge Cases

- **Offline Mode during Field Service**: Technician enters an underground basement or rural area without cell service while completing a job. The app's offline queue (`NetInfo`) must buffer status changes and proof photos locally, re-broadcasting once cellular connectivity returns.
- **GPS Permission Denial**: Technician denies fine location permissions. The app must degrade gracefully, prompting with an informative notice rather than crashing the navigation map.
- **Camera Access Refusal during Photo Proof**: If camera or photo library access is denied, clear permission instructions must be presented before disabling the submit button.
- **Simultaneous Cancellation**: Customer cancels the job while the technician is in transit. The app must notify the worker immediately and release them back to the `WAITING` state.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST correct all navigation route definitions in `StaffSidebar.tsx` to link to existing physical paths (`/(staff)/(tabs)/today`, `/(staff)/availability`, `/(staff)/(tabs)/money`, `/(staff)/(tabs)/me`, `/(staff)/timeoff`, `/(staff)/performance`, `/(staff)/history`).
- **FR-002**: Staff screens MUST adopt unified design tokens: pure white cards (`#FFFFFF`), hairline borders (`#E2E8F0`), deep charcoal primary text (`#0F172A`), slate secondary text (`#64748B`), and neutral background (`#F8FAFC`).
- **FR-003**: System MUST enforce safe area clearance (`paddingBottom: 120`) across all staff scrollable views to avoid occlusion by the floating bottom navigation bar.
- **FR-004**: System MUST utilize discrete semantic status indicator dots (Emerald `#059669` for Online/Completed, Amber `#D97706` for On-Job/Pending, Red `#DC2626` for Offline/Cancelled).
- **FR-005**: The `Today` dispatch screen MUST maintain the operational state machine (`WAITING`, `NEW_JOB`, `TRAVELING`, `ARRIVED`, `WORKING`, `COMPLETED`) with reliable offline synchronization.
- **FR-006**: The job completion flow MUST validate mandatory before and after proof photos and customer digital signature before authorizing the completion swipe.
- **FR-007**: Staff earnings view MUST display daily earnings, weekly velocity charts, and itemized completed trip records fetched from `GET /api/staff/performance` and `GET /api/bookings/my-assignments`.
- **FR-008**: Staff availability console MUST allow technicians to toggle their weekly working days and view approved time-off requests.
- **FR-009**: Emergency dispatch alert trigger MUST allow technicians to instantly initiate an emergency call or notify dispatch with current GPS coordinates.

---

## Measurable Success Criteria

- **SC-001**: Zero broken navigation links or router warnings when tapping every entry in `StaffSidebar` and `(tabs)/_layout`.
- **SC-002**: 100% of staff screens adhere to the corporate cockpit color and component specification.
- **SC-003**: Zero visual overlap between scrolling content and floating tab bars across various screen dimensions (iOS & Android).
- **SC-004**: Complete TypeScript type safety verification (`npx tsc --noEmit`) with 0 errors across the entire `frontend-expo` project.
- **SC-005**: Customer module (`frontend-expo/app/(customer)/**`) remains 100% frozen with zero modifications.
