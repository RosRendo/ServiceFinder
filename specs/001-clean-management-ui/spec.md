# Feature Specification: Clean Management UI (Company & Admin Refit)

**Feature Branch**: `001-clean-management-ui`

**Created**: 2026-09-25

**Status**: Draft

**Input**: User description: "clean up the company and admin management design make it clean avoid ai slop and easy to use"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Streamlined Company Operations Workspace (Priority: P1)

A company manager or dispatcher needs a focused, distraction-free operations dashboard to monitor field staff availability, inspect incoming service requests, and assign or reschedule bookings rapidly without visual noise, nested decorative cards, or multi-layered menus.

**Why this priority**: Daily business operations and revenue generation depend on dispatchers swiftly assigning jobs and updating customer bookings without cognitive overload or UI friction.

**Independent Test**: A company manager can log into their workspace, immediately scan pending jobs with high-contrast status indicators, and assign an available technician in under 3 clicks without encountering decorative animations, nested borders, or bloated filler widgets.

**Acceptance Scenarios**:

1. **Given** a company manager viewing active operations, **When** examining the bookings list, **Then** all booking details (customer name, service type, assigned staff, scheduled time, status) are displayed in a clean, high-density scannable view with zero decorative gradients or glowing elements.
2. **Given** an unassigned incoming booking, **When** the manager initiates staff assignment, **Then** a concise selection interface displays currently available staff sorted by availability and workload, enabling assignment confirmation with a single decisive action.
3. **Given** a manager updating company services or pricing, **When** navigating the catalog section, **Then** services are displayed in structured tables with direct inline actions (Edit, Toggle Active, Delete) rather than bulky decorative cards.

---

### User Story 2 - High-Efficiency Platform Superadmin Governance (Priority: P2)

A platform administrator needs an authoritative, clean governance console to verify new service companies, review compliance documents, moderate user accounts, and audit financial transactions without decorative AI-slop widgets, ambiguous icons, or misaligned headers.

**Why this priority**: Marketplace trust, platform compliance, and safety depend on superadmins swiftly processing verification queues and resolving disputes without navigating through visually chaotic pages.

**Independent Test**: An administrator can open the company verification queue, inspect submitted business credentials in a clean two-column review panel, and issue an approval or reason-coded rejection with zero layout distortion.

**Acceptance Scenarios**:

1. **Given** an admin reviewing pending service providers, **When** opening a company verification item, **Then** business details, license attachments, and identity credentials appear in a clean, structured split view with clear primary actions ("Approve", "Request Changes", "Reject").
2. **Given** an administrator investigating a customer dispute or flagged review, **When** accessing the moderation view, **Then** the complete event timeline and statements are presented in quiet, legible neutral cards with unambiguous resolution triggers.
3. **Given** an administrator auditing system payouts, **When** inspecting payout requests, **Then** financial ledgers and bank callback details are presented in a monospace, high-contrast tabular format with bulk-authorization capabilities.

---

### User Story 3 - Unified Design System & Information Architecture (Priority: P3)

Both company managers and platform administrators need a cohesive visual language, consistent navigation structure, and predictable interaction rhythm across all management screens, eliminating inconsistent button styling, rainbow status badges, and decorative filler metrics.

**Why this priority**: Inconsistent navigation patterns and visual noise increase operator error rates and fatigue during extended administrative sessions.

**Independent Test**: An operator navigating across any management sub-page (staff, bookings, services, payouts, compliance, settings) experiences identical header layouts, table filter patterns, status badges, and button hierarchies.

**Acceptance Scenarios**:

1. **Given** an operator navigating between different management screens, **When** switching tabs or routes, **Then** page headers, search/filter bars, and pagination controls remain consistently positioned and styled with standard neutral design tokens.
2. **Given** any status indicator (e.g., Active, Pending, Suspended, Completed), **When** rendered anywhere in the management interfaces, **Then** it uses a subtle, standard semantic badge with legible contrast rather than saturated rainbow gradients.
3. **Given** any overview screen, **When** metrics are shown, **Then** every statistic represents actionable operational data (e.g., "3 pending approvals", "2 unassigned bookings") that links directly to the relevant filtered work queue rather than vanity decorative graphs.

---

### Edge Cases

- **Empty States**: When a list or data table contains zero records, the system displays a quiet, minimal empty state with a single explanatory sentence and a direct primary action button (e.g., "Add First Staff Member"), avoiding oversized cartoon illustrations or empty whitespace voids.
- **Responsive Screen Adaptation**: On mobile or tablet viewports, multi-column data tables gracefully adapt into structured vertical summary cards without horizontal overflow or clipping action buttons.
- **Bulk Action Operations**: When an operator selects multiple records for batch processing (e.g., approving 5 companies or assigning multiple bookings), a clean floating action bar shows the exact selected count and explicit confirmation prompts to prevent accidental mass updates.
- **Network Latency & Error Recovery**: When an operational mutation is pending, action buttons enter a subdued loading state with fixed dimensions to prevent layout jumps; if a network failure occurs, a concise toast notification explains the error with an immediate "Retry" button.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a unified, minimal management layout with clear visual hierarchy, eliminating decorative gradients, glowing borders, and redundant nested containers.
- **FR-002**: Company management interfaces MUST present operational data (bookings, staff, services, payouts) in high-density, scannable tabular or list formats with immediate search, sorting, and status filtering.
- **FR-003**: Admin governance interfaces MUST provide dedicated, single-view verification and moderation workflows with clear action triggers (Approve, Reject, Flag, Suspend).
- **FR-004**: System MUST standardize all status indicators (Pending, Approved, In Progress, Completed, Suspended, Cancelled) to a unified quiet semantic color palette with high-contrast text.
- **FR-005**: All forms in management views (e.g., adding staff, editing company profile, setting service pricing) MUST group related fields into clearly titled sections with inline validation and clear "Save Changes" / "Cancel" controls.
- **FR-006**: System MUST ensure every interactive table and list includes responsive search, status filtering, and clear pagination or infinite scroll controls.
- **FR-007**: Management navigation MUST provide breadcrumb or consistent top-level section headers so operators always know their current location within the hierarchy.
- **FR-008**: System MUST replace vague or decorative metric widgets with actionable operational indicators (e.g., "3 pending verifications", "2 unassigned bookings today") that link directly to the filtered action queues.
- **FR-009**: System MUST ensure all destructive actions (e.g., suspending a company, deleting a service, canceling a booking) require explicit two-step confirmation with clear consequence disclosure.
- **FR-010**: All tabular and card interfaces MUST preserve legible typography with dedicated spacing for data columns, avoiding text truncation on critical IDs, monetary amounts, and timestamps.

### Key Entities *(include if feature involves data)*

- **Company Profile**: Represents an onboarded service provider organization, including legal name, contact credentials, verification status, active service coverage areas, and operational staff roster.
- **Staff Member**: Represents an employee or field technician linked to a company, with assigned role, availability state, contact info, and active booking queue.
- **Booking Assignment**: Represents a customer service order routed to a company, detailing customer location, scheduled window, assigned technician, and execution status.
- **Verification Ticket**: Represents an administrative review item for a company or staff certification, holding document references, reviewer notes, and decision status.
- **Platform Audit Record**: Represents an immutable log entry tracking administrative actions (approvals, suspensions, fee modifications) with operator ID and timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Operators can complete standard daily workflows (dispatching a booking, approving a company, adding a staff member) in under 3 clicks from the section root.
- **SC-002**: Visual clutter is eliminated: 100% of company and admin management screens adhere to a unified quiet design palette with zero decorative glowing borders, gradient fills, or faux-dashboard filler cards.
- **SC-003**: Information retrieval efficiency: Operators can locate any specific booking, company, or staff record in under 5 seconds using unified search and filter controls.
- **SC-004**: First-time operator usability: New company managers or admin staff can perform core operations without training manuals or external tooltips, achieving a 95% first-attempt task completion rate.
- **SC-005**: Zero layout overflow: 100% of data tables and management forms render without horizontal clipping or broken button layouts across standard desktop and tablet viewports.

## Assumptions

- Operators access management features via modern desktop web browsers (primary for admin/company operations) and tablet/mobile devices (field management).
- Role-based authorization is enforced upstream (Platform Superadmins have full marketplace governance; Company Admins have access strictly scoped to their own company's data and staff).
- Existing backend REST/GraphQL endpoints and PostgreSQL database schemas will be utilized without destructive migrations.
- The redesign focuses on layout clarity, information density, visual quietness, and operational efficiency while preserving all underlying business capabilities.
