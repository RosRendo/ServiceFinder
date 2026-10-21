# Feature Specification: Role Flow Hierarchy Validation & Optimization

**Feature Branch**: `007-role-flow-hierarchy`

**Created**: 2026-10-05

**Status**: Draft

**Input**: User description: "check other role is it already good flow hirachy used yet?"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Field Technician Fast-Track Daily Itinerary & Job Execution (Priority: P1)

As a field technician ("Staff"), I want a dedicated mobile daily workspace where I can toggle my shift availability, review ordered assignments for the day, navigate to client locations with one tap, log progress milestones (En Route, Arrived, In Progress, Completed), capture proof of completion, and log physical cash collected so that I can execute on-demand service dispatches efficiently without friction or administrative overhead.

**Why this priority**: Field technicians are the core delivery arm of on-demand home services. If their daily flow is cluttered, confusing, or has broken status transitions, jobs stall, customer ETA visibility breaks, and revenue collection fails.

**Independent Test**: Can be tested independently by logging in as a field technician, switching status to "Available", viewing an assigned booking in the daily itinerary, advancing the job through all lifecycle stages with GPS check-in and completion proof, and recording cash received.

**Acceptance Scenarios**:

1. **Given** a technician is logged into the mobile application, **When** they toggle their availability switch to "On Shift", **Then** their availability status updates immediately and the dispatch radar marks them eligible for new nearby dispatch requests.
2. **Given** an assigned job in "Confirmed" status on the daily itinerary, **When** the technician taps "En Route", **Then** the job status transitions to "On the Way", the client is notified, and a one-tap external navigation launcher provides route directions.
3. **Given** a technician arrives at the service address, **When** they tap "Arrived" and subsequently "Start Service", **Then** the booking status updates to "In Progress", starting an active service timer and recording milestone timestamps.
4. **Given** an in-progress service reaching completion, **When** the technician submits completion proof (photo and summary notes) and confirms payment collection (cash or digital confirmation), **Then** the job transitions to "Completed", updates the technician's daily earnings tally, and archives the job from active tasks.

---

### User Story 2 - Company Dispatch & Technician Fleet Operations (Priority: P1)

As a service company administrator or dispatcher, I want a unified operational console with clear tab hierarchy (Dashboard, Dispatch Operations, Staff Fleet, Financial Reconciliation, and Service Management) so that I can assign incoming direct bookings to the best-suited nearby pro, track active technician workloads in real time, and audit physical cash collected before remittance.

**Why this priority**: Companies manage multiple technicians and high daily booking volumes. A fragmented or ambiguous company hierarchy causes dispatch bottlenecks, unassigned jobs exceeding response SLAs, and uncollected or unverified revenues.

**Independent Test**: Can be tested independently by logging in as a company admin, receiving a newly booked customer request in the dispatch queue, assigning it to an available technician, viewing the live status transition on the operations board, and reconciling cash collected at the end of the shift.

**Acceptance Scenarios**:

1. **Given** a newly confirmed customer booking requiring fulfillment, **When** the company dispatcher opens the Operations tab, **Then** the unassigned booking appears highlighted with customer location, requested time slot, and recommended available technicians sorted by proximity.
2. **Given** an unassigned booking, **When** the dispatcher selects an available technician and confirms assignment, **Then** the technician's daily schedule is updated, the booking status transitions to "Assigned", and a push notification alerts the technician.
3. **Given** field technicians collecting on-site cash payments, **When** the company administrator opens the Finance tab, **Then** the console displays a real-time reconciliation ledger showing collected cash per pro, pending remittance amounts, and company payout balance.
4. **Given** team changes or skill expansions, **When** the company administrator manages the Staff tab, **Then** they can view pro active statuses, invite new team members, assign specialty service categories, and toggle active dispatch eligibility.

---

### User Story 3 - Platform Superadmin Quality & Dispute Governance (Priority: P2)

As a platform superadmin, I want a high-level governance hierarchy (Global Health Dashboard, Real-time Dispatch Queue, Company Vetting, User Access Control, and Dispute Resolution) so that I can maintain marketplace trust, audit unresolved bookings, arbitrate customer-company disputes, and approve or suspend service providers.

**Why this priority**: Platform scalability and trust require supervisory guardrails. Admins must not be bogged down in daily dispatches, but must have rapid oversight tools when SLA breaches, safety flags, or payment disputes occur.

**Independent Test**: Can be tested independently by logging in as a superadmin, reviewing a pending company onboarding application, approving their business credentials, viewing the global queue of active jobs, and arbitrating a simulated customer dispute with escrow refund action.

**Acceptance Scenarios**:

1. **Given** a newly registered service company submitting business verification documents, **When** the superadmin reviews the verification queue, **Then** they can inspect company licenses, identity proofs, and tax registrations, and either approve or reject with specific feedback.
2. **Given** an escalated booking dispute between a customer and a service company, **When** the superadmin reviews the issue in the Governance tab, **Then** the full chronological audit trail (messages, milestone timestamps, completion photos, and payment records) is displayed with options to release escrow funds or issue a partial/full refund.
3. **Given** abnormal marketplace behavior or customer safety reports, **When** the superadmin views user or company profiles, **Then** they can temporarily suspend dispatch privileges or ban offending accounts with documented justification.

---

### Edge Cases

- **Interrupted Network During Milestone Update**: What happens when a technician taps "Completed" or "Arrived" in an area with spotty network coverage? The action must queue locally with guaranteed timestamp preservation and sync automatically once connectivity is restored.
- **Simultaneous Dispatch Assignment**: What happens if two dispatchers attempt to assign the same job to different technicians simultaneously, or if a technician declines an assigned job? The system must lock assignment atomically and provide immediate visual feedback if the job was already claimed.
- **Unremitted Cash Accumulation**: What happens if a technician reaches a defined cash-in-hand threshold without remitting cash to the company? The system must trigger an alert and restrict further cash-on-delivery assignments until reconciled.
- **Role Switching and Multi-Role Accounts**: What happens when an account possesses multiple roles or switches permissions? The system must cleanly route to the designated primary workspace without stale session state or unauthorized view access.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST strictly isolate role navigation workspaces so that Field Technicians, Company Dispatchers, and Platform Superadmins access only their dedicated views and role-appropriate actions.
- **FR-002**: Field Technician workspace MUST provide a consolidated daily itinerary showing all scheduled and on-demand assignments sorted chronologically with status tags.
- **FR-003**: Field Technician workspace MUST allow single-tap lifecycle status progression through the standard sequence: Acknowledged -> En Route -> Arrived -> In Progress -> Completed.
- **FR-004**: Field Technician workspace MUST support capturing and attaching completion verification (photographs and job notes) before an in-progress job can be marked completed.
- **FR-005**: Field Technician workspace MUST record physical cash payments collected on site, update the technician's unremitted cash balance, and emit a digital receipt confirmation.
- **FR-006**: Field Technician workspace MUST provide an availability toggle allowing pros to signal "Online/Available for Dispatch" or "Offline/Off Shift" with immediate visual confirmation.
- **FR-007**: Company console MUST provide a centralized dispatch board displaying incoming unassigned bookings, assigned jobs in progress, and completed services with real-time status indicators.
- **FR-008**: Company console MUST enable dispatchers to assign unassigned bookings to specific eligible staff members with proximity and workload context.
- **FR-009**: Company console MUST provide a staff roster view displaying each technician's current status (Active Job, Available, Off Shift), assigned service categories, and contact shortcuts.
- **FR-010**: Company console MUST provide a financial ledger tracking gross service billings, platform commissions, net company earnings, and cash collected by technicians awaiting company settlement.
- **FR-011**: Platform Superadmin console MUST provide an onboarding vetting interface allowing administrators to inspect submitted business credentials, verify identity documents, and grant or deny operating approval.
- **FR-012**: Platform Superadmin console MUST provide a global dispatch queue monitor that flags unassigned jobs approaching SLA breach thresholds.
- **FR-013**: Platform Superadmin console MUST provide a dispute resolution workspace displaying complete booking history, customer-provider chat transcripts, and escrow status to arbitrate refunds or disbursements.
- **FR-014**: All role-specific primary actions (navigation, status updates, staff assignment, dispute resolution) MUST present responsive confirmation feedback and prevent duplicate submissions.

### Key Entities

- **Dispatch Assignment**: Represents a customer service request routed to a company and allocated to a specific field technician, with lifecycle timestamps, location coordinates, pricing, and fulfillment state.
- **Staff Profile**: Represents an on-field service professional associated with a company, containing active shift state, current geographic location, assigned service categories, rating, and cash-in-hand balance.
- **Company Fleet Ledger**: Represents the company's operational and financial accounting record, tracking active personnel, completed jobs, cash collected vs. bank disbursements, and platform commission deductions.
- **Dispute Record**: Represents an escalated issue regarding service quality, non-attendance, or billing contention, holding chronological evidence, disputed amount, customer statement, provider response, and administrative decision.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Field technicians can view their current active assignment and initiate directions in under 2 taps from app launch.
- **SC-002**: Job status transitions (En Route, Arrived, In Progress, Completed) update across customer, technician, and company views within 2 seconds.
- **SC-003**: Company dispatchers can successfully evaluate and assign an incoming booking to an available pro in under 30 seconds.
- **SC-004**: 100% of physical cash collections on completed jobs are accurately attributed to the collecting pro's ledger with zero reconciliation discrepancies.
- **SC-005**: Superadmins can review and process a company verification submission or dispute arbitration case in under 3 minutes with full audit trail visibility.
- **SC-006**: Zero dead-end screens, broken navigation links, or unresponsive primary action buttons across all three non-customer role hierarchies.

## Assumptions

- Field technicians use mobile smartphones equipped with GPS and camera capabilities for location check-ins and completion photo uploads.
- Company administrators access their operational tools via both mobile tablets/phones and desktop web dashboards.
- Platform superadmins primarily operate desktop web consoles for heavy administrative and dispute tasks, with mobile view access for urgent on-call queue checks.
- Cash collection on delivery remains a supported payment option in the marketplace, requiring strict pro ledger tracking and company remittance workflows.
- Booking and service pricing structures are established prior to dispatch assignment and displayed transparently to both pro and customer.
