# Feature Specification: Admin Mobile Cockpit Redesign

**Feature Branch**: `010-admin-portal-redesign`

**Created**: 2026-10-06

**Status**: Draft

**Input**: User description: "how about the design on admin need to upgrade too need to check it all out mobile screeen"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Executive Command Dashboard & SLA Alerts (Priority: P1)

As a Platform Superadmin operating from a mobile device, I want a high-contrast executive cockpit dashboard that immediately highlights critical platform metrics (Platform Revenue, Active Users, Verified Companies, Platform Bookings) and urgent action items (Pending Company Approvals, Active Disputes, Pending Payout Batches) so that I can monitor marketplace health and respond to bottlenecks in real time.

**Why this priority**: The dashboard is the primary entry point for administrators on mobile. It establishes situational awareness and drives immediate triage of platform operations.

**Independent Test**: Can be tested by logging into the admin role on mobile and viewing the Dashboard tab. Verify all metrics load cleanly from the analytics endpoint, urgent alert badges accurately reflect outstanding queue counts without hardcoded fallbacks, and content is not clipped by the floating bottom tab bar.

**Acceptance Scenarios**:
1. **Given** an admin user on the mobile dashboard, **When** the screen mounts or pulls to refresh, **Then** the platform GMV, platform commission, completed bookings, and user counts are displayed in cohesive executive cards with loading skeletons/spinners and zero hardcoded fallback counts.
2. **Given** pending company verifications, open disputes, or pending payouts, **When** the admin taps any urgent SLA banner item, **Then** the app navigates immediately to the corresponding triage queue.
3. **Given** a mobile viewport, **When** scrolling to the bottom of the dashboard, **Then** all cards and recent company listings remain fully visible above the floating tab bar with safe bottom padding (`paddingBottom >= 120`).

---

### User Story 2 - Rapid Business Verification & Document Inspection (Priority: P2)

As a Platform Administrator, I want a streamlined approval queue and company directory on mobile that allows me to inspect company credentials (business license, tax ID, insurance), toggle verification status, and provide rejection reasons with 1 tap, so that onboarded companies are not delayed waiting for desktop audits.

**Why this priority**: Company onboarding velocity directly impacts marketplace supply growth. Mobile administrators must be able to audit and unblock legitimate providers on the go.

**Independent Test**: Can be tested by opening the Approvals tab (`queue.tsx`), reviewing pending companies, opening the credential inspection view, and executing an approval or rejection.

**Acceptance Scenarios**:
1. **Given** pending provider applications, **When** viewing the Approvals tab, **Then** applications are grouped by status (Pending, Under Review, Verified, Rejected) with clean segment tabs rather than cumbersome horizontal off-screen boards.
2. **Given** a pending business card, **When** tapping "Inspect Credentials", **Then** the admin can review submitted registration documents, business details, and contact info in a clean inspection card.
3. **Given** an audit decision, **When** tapping "Verify Business", **Then** the company status updates to verified, the queue refreshes dynamically, and the company is immediately enabled for marketplace dispatch.

---

### User Story 3 - Dispute Triage & Escrow Mediation (Priority: P3)

As a Platform Administrator, I want to review customer-provider disputes on mobile, view escrow funds at stake, read customer and provider statements, and resolve or escalate cases, so that trust and safety issues are resolved before escalating to payment chargebacks.

**Why this priority**: Rapid dispute resolution protects marketplace trust, prevents payment chargebacks, and enforces fair trading between customers and service companies.

**Independent Test**: Can be tested by opening the Issues tab (`issues.tsx`), filtering by open disputes, inspecting case details, and viewing the resolution options.

**Acceptance Scenarios**:
1. **Given** unresolved disputes, **When** opening the Issues tab, **Then** disputes are ordered by SLA urgency, highlighting the dispute reason, booking reference, and disputed dollar amount.
2. **Given** a selected dispute, **When** opening dispute details, **Then** both customer complaint evidence and provider response statements are rendered in a clear chronologic timeline.
3. **Given** mediation options, **When** resolving the dispute, **Then** the admin can select from structured resolution outcomes (Full Refund, Split Settlement, or Provider Release) with an audit note.

---

### User Story 4 - Unified Admin Operations Hub & Security Settings (Priority: P4)

As a Platform Administrator, I want an organized platform administration hub and sliding drawer that provides 1-tap navigation to all platform operations (Audit Logs, System Monitoring, Platform Payouts, Global Refunds, Service Categories, Promotions, Broadcasts) and account security settings, so that no platform capability is hidden or orphaned on mobile.

**Why this priority**: Administrators need centralized access to deep management tools without memorizing deep URL routes.

**Independent Test**: Can be tested by navigating to the More/Settings tab (`settings.tsx`) and the Admin Drawer (`AdminSidebar.tsx`), verifying every platform governance module is categorized and navigable.

**Acceptance Scenarios**:
1. **Given** the More tab or Admin Drawer, **When** viewing available modules, **Then** items are grouped into clear executive domains: Platform Governance, Marketplace Entities, Financial Operations, and Account Security.
2. **Given** a navigation selection, **When** tapping any management module (e.g. Audit Logs, Payouts, Broadcasts), **Then** the app navigates smoothly to the corresponding screen with a cohesive top header and back button.

---

### Edge Cases

- What happens when an admin has poor network connectivity while verifying a company?
  - Actions show immediate optimistic loading indicators, disable repeated button taps, and display user-friendly error banners with retry prompts if the request fails.
- What happens when a company application has missing or unparseable document attachments?
  - The Credential Inspection card indicates "Document Missing" or "Pending Upload" with a distinct warning badge rather than crashing or showing a broken image link.
- What happens when there are zero pending verifications or disputes?
  - Clear, quiet executive empty state illustrations with reassuring confirmation copy (e.g., "Queue All Clear — All provider applications are reviewed").
- How are high-density and varied mobile screens handled?
  - All cards, metrics ribbons, and floating bars use responsive constraints (`Platform.select`, `SafeAreaView`, `gap`, `paddingBottom: 120`) to prevent cutoffs across iOS and Android devices.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST present a cohesive Quiet Luxury / Obsidian Executive design aesthetic across all admin mobile screens (`app/(admin)/**`), using deep slate `#0A192F` surfaces, high-contrast typography, and restrained semantic status accents.
- **FR-002**: System MUST eliminate all hardcoded fallback mock counts (e.g., `payoutRequests || 8`) from mobile admin metrics and display accurate backend data or neutral dashes (`—`) when data is unavailable.
- **FR-003**: System MUST enforce safe bottom scrolling padding (`paddingBottom: 120` or higher) across all admin tab screens (`dashboard.tsx`, `queue.tsx`, `issues.tsx`, `companies.tsx`, `settings.tsx`, `users.tsx`, `analytics.tsx`) so content is never occluded by the floating bottom tab bar.
- **FR-004**: System MUST provide an ergonomic segmented tab filter system (Pending, Under Review, Verified, Rejected) with fast vertical list scrolling for business verification and directory navigation (`queue.tsx`, `companies.tsx`), replacing multi-column horizontal Kanban swipe boards on mobile portrait viewports.
- **FR-005**: System MUST provide in-line credential inspection allowing administrators to inspect submitted company verification proofs, business license numbers, and insurance details directly on mobile before approval.
- **FR-006**: System MUST enforce a two-step confirmation modal with a required administrative resolution note before releasing, splitting, or refunding platform escrow funds on mobile (`issues.tsx`, `disputes/[id].tsx`), protecting marketplace capital and preventing accidental taps.
- **FR-007**: System MUST centralize access to all secondary platform management screens (Audit Logs, Monitoring, Payouts, Refunds, Compliance, Categories, Service Types, Broadcasts, Promotions) within both `settings.tsx` and `AdminSidebar.tsx`.
- **FR-008**: System MUST support pull-to-refresh on all list and metric views with standard activity indicators and resilient `ErrorState` retry mechanisms.

### Key Entities

- **PlatformMetrics**: Snapshot of real-time marketplace activity including gross volume, platform fee revenue, active users, company verification counts, open dispute counts, and pending payout requests.
- **CompanyVerificationApplication**: Business application record containing company profile, registration numbers, tax identifier, uploaded license/certificate attachments, verification status (`pending`, `under_review`, `verified`, `rejected`), and review notes.
- **DisputeCase**: Customer-provider mediation record containing booking ID, disputed monetary amount, filing timestamp, customer claim reason, provider counter-statement, and resolution state (`open`, `responded`, `resolved`, `escalated`).
- **AdminAuditAction**: Historical log entry recording administrator identity, target entity, timestamp, action type (`VERIFY_COMPANY`, `RESOLVE_DISPUTE`, `ISSUE_REFUND`), and optional reason text.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of admin mobile screens under `frontend-expo/app/(admin)/**` adhere to the unified executive design system with 0 overlapping floating tab bar collisions.
- **SC-002**: Zero hardcoded mock numbers or dummy fallbacks displayed across the mobile admin interface.
- **SC-003**: Administrators can complete a company verification review and decision in under 30 seconds on a mobile device.
- **SC-004**: Administrators can review and inspect open dispute details in under 45 seconds from the mobile issues queue.
- **SC-005**: All admin tab screens maintain 60 FPS scrolling and pass TypeScript compilation with 0 errors (`npx tsc --noEmit`).

## Assumptions

- Target administrators use iOS and Android smartphones with standard network connectivity.
- Existing backend NestJS endpoints (`/api/admin/analytics`, `/api/admin/companies`, `/api/disputes`, `/api/admin/companies/:id/verify`) provide all necessary marketplace data and authorization checks.
- Mobile admin views are restricted to users with `ADMIN` / `SUPERADMIN` JWT role claims.
- The Customer application (`frontend-expo/app/(customer)/**`) remains strictly frozen and untouched.
