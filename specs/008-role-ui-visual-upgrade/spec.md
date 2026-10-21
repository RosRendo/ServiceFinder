# Feature Specification: Non-Customer Role UI Visual Upgrade & Text Distillation

**Feature Branch**: `008-role-ui-visual-upgrade`

**Created**: 2026-10-05

**Status**: Draft

**Input**: User description: "how about designing is there any replace with design and good visual if there are more text need to be remove to all staff company and admin only dont change anything on customer"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Field Technician Visual Cockpit & Glanceable Execution (Priority: P1)

As a field technician ("Staff"), I want a visual, glanceable daily workspace where verbose explanatory text, paragraphs, and repetitive instructions are replaced with high-contrast icon badges, visual milestone steppers, and clear action chips so that I can inspect and advance jobs while on the move without reading walls of text.

**Why this priority**: Field technicians operate in bright sunlight, on motorcycles or vehicles, and in client homes. Long paragraphs of instructions cause cognitive load and delay milestone reporting. High-glanceability visual indicators increase operational safety and speed.

**Independent Test**: Can be tested independently by logging in as a field technician, viewing the active job dashboard, and verifying that all assignment details (timing, destination, status, payout) are comprehended within 3 seconds using visual iconography and chips, with zero multi-sentence descriptive paragraphs.

**Acceptance Scenarios**:

1. **Given** an active assignment on the daily itinerary, **When** the technician views the job card, **Then** key job attributes (service category, distance, scheduled time window, customer contact, and payout) are rendered as compact visual badges and icons with no instructional text blocks.
2. **Given** a technician progressing through work milestones, **When** they look at the job status, **Then** a visual horizontal progression bar highlights the active stage (En Route, Arrived, Working, Completed) instead of a verbose text explanation.
3. **Given** a technician reviewing their financial ledger, **When** they view earnings and unremitted cash, **Then** balances are displayed in large-format numerical metrics accompanied by visual status chips and progress bars rather than wordy payroll disclaimer paragraphs.

---

### User Story 2 - Company Dispatch High-Density Visual Operations (Priority: P1)

As a company dispatcher or fleet manager, I want a high-density, visual dispatch board where booking cards and technician statuses replace wordy descriptions with color-coded urgency chips, proximity radar indicators, and one-tap allocation buttons so that I can triage and dispatch dozens of bookings per hour with minimal visual fatigue.

**Why this priority**: Dispatchers manage high-velocity operational queues. Replacing walls of booking text with structured, visual tags and proximity meters allows dispatchers to match jobs to technicians 3x faster without reading through repetitive metadata.

**Independent Test**: Can be tested independently by logging in as a company admin, opening the dispatch board, and identifying unassigned urgent bookings, technician proximity, and cash balances solely through visual indicators, badges, and avatar tags.

**Acceptance Scenarios**:

1. **Given** unassigned incoming bookings on the dispatch board, **When** the dispatcher views the list, **Then** each booking displays an urgency countdown badge, service icon, map pin chip, and a prominent 1-tap "Assign" pill without descriptive text paragraphs.
2. **Given** an assignment modal listing eligible crew members, **When** the dispatcher reviews technicians, **Then** availability is indicated by glowing green/gray status pulses, live distance chips, and active workload counters rather than text-based status descriptions.
3. **Given** company financial and cash auditing views, **When** reviewing field crew physical cash collections, **Then** unremitted balances are summarized in a visual reconciliation table with color-coded threshold chips and quick-action settle icons.

---

### User Story 3 - Superadmin Visual Governance & Anomaly Triage (Priority: P2)

As a platform superadmin, I want a clean, executive governance console where company vetting dockets, dispatch SLA queues, and dispute arbitrations replace dense paragraphs with visual document cards, color-graded SLA countdown meters, and visual escrow split sliders so that I can resolve marketplace anomalies rapidly.

**Why this priority**: Platform supervision requires quick pattern recognition and rapid decision-making. Removing administrative text clutter and replacing it with visual health meters and structured credential previews speeds up dispute and vetting resolutions.

**Independent Test**: Can be tested independently by logging in as a superadmin, reviewing a pending company onboarding application via a visual document inspector, and resolving a dispute using visual settlement chips without reading through dense text explanations.

**Acceptance Scenarios**:

1. **Given** a company submitted for vetting, **When** the superadmin reviews the verification queue, **Then** business licenses and identity credentials are presented as visual inspection cards with instant "Verify" and "Reject" pill actions.
2. **Given** the global dispatch queue, **When** unassigned bookings approach SLA limits, **Then** a color-graded visual timeline (Green < 5m, Amber 5-15m, Red > 15m) visually flags urgent items.
3. **Given** an escalated customer-company dispute, **When** arbitrating the case, **Then** evidence photos, disputed escrow amount, and settlement options are displayed in a clean comparative split layout.

---

### Edge Cases

- **Small Screen & Font Scaling**: What happens when a user increases device font size or uses a compact smartphone screen? Visual badges and icon chips must dynamically wrap without truncating critical currency figures or milestone action buttons.
- **Missing or Incomplete Evidence Photos**: What happens when a dispute or company verification lacks image uploads? Clean visual empty-state icons must display in place of broken thumbnails or generic text error messages.
- **Color Blindness & Accessibility**: How does the visual redesign maintain clarity for color-blind users? Status indicators must combine color with distinct iconography and shape outlines (e.g., checkmarks, clocks, alert triangles) so meaning is never communicated solely through color.
- **Customer UI Isolation**: How is it guaranteed that customer-facing screens remain completely untouched? All visual modifications must be strictly scoped to `(staff)`, `(company)`, and `(admin)` views, with zero modifications to `(customer)` or shared customer components.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST strictly preserve all customer interfaces, customer booking flows, and customer navigation without any design or text modifications.
- **FR-002**: Field Technician daily workspace MUST replace descriptive instructional paragraphs with compact visual badges, icon chips, and glanceable milestone indicators.
- **FR-003**: Field Technician active job card MUST render primary actions (navigation, arrival, work start, completion) as prominent, high-contrast action buttons with clear iconography.
- **FR-004**: Field Technician earnings workspace MUST present net earnings, job counts, and unremitted physical cash as large-format numerical metrics with visual threshold warning chips instead of wordy payroll disclaimers.
- **FR-005**: Field Technician daily workspace MUST display a visual progress stepper illustrating current job lifecycle stage (En Route -> Arrived -> Working -> Completed).
- **FR-006**: Company dispatch board MUST present incoming bookings as compact visual cards featuring service category icons, urgency badges, customer avatar chips, and one-tap assignment triggers without narrative text blocks.
- **FR-007**: Company pro allocation modal MUST display technician availability using visual glowing status dots (green = online, gray = offline), proximity distance chips, and active workload counters.
- **FR-008**: Company fleet roster MUST render live pro radar and technician cards with visual rating stars, category tags, and quick-action icon buttons for phone and chat.
- **FR-009**: Company financial console MUST replace long banking text blocks with structured visual ledger cards, compact cash audit chips, and instant settlement buttons.
- **FR-010**: Platform Superadmin console MUST replace text-heavy company vetting lists with visual document preview cards featuring structured metadata chips and one-click verification pills.
- **FR-011**: Platform Superadmin dispatch queue MUST display real-time SLA urgency using color-graded visual timeline bars rather than plain text countdown descriptions.
- **FR-012**: Platform Superadmin dispute workspace MUST render evidence photos, claims, and settlement options in a clean visual split card format.
- **FR-013**: All non-customer cards and list items MUST adhere to a consistent visual hierarchy with standardized typography scale, rounded corners, subtle elevation, and distinct light/dark surface contrasts.
- **FR-014**: All visual icons and badges MUST incorporate dual visual cues (iconography plus text label) to preserve accessibility across all non-customer screens.

### Key Entities

- **Visual Milestone Stepper**: A non-customer component tracking the chronological stages of a dispatch assignment using icons, progress bars, and high-contrast active states.
- **Urgency Indicator Chip**: A color-graded badge (Green/Amber/Red) indicating remaining response time before dispatch SLA breach.
- **Pro Radar Marker**: A map-based or roster visual element combining technician avatar, live status pulse, and distance calculation.
- **Credential Preview Card**: An administrative visual component displaying uploaded business documents and identity proofs with one-tap decision controls.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Descriptive explanatory text volume across Staff, Company, and Admin screens is reduced by at least 60% compared to previous baseline, measured by total character count of non-metric labels.
- **SC-002**: Field technicians can identify their destination address, customer name, and next required action within 2 seconds of viewing the active job card.
- **SC-003**: Company dispatchers can evaluate an unassigned booking's urgency, service type, and proximity within 3 seconds of scanning the dispatch board.
- **SC-004**: Superadmins can inspect company verification credentials and execute a decision in under 30 seconds per record.
- **SC-005**: 100% of customer screens and customer-facing components remain completely unchanged and functionally identical.
- **SC-006**: Zero dead-end buttons, visual overlap glitches, or illegible text across all tested mobile and tablet viewport dimensions.

## Assumptions

- Users operating non-customer roles are familiar with standard mobile on-demand icons (map pin for address, phone for calling, chat bubble for messaging, star for rating, cash for physical payments).
- Removing wordy explanatory paragraphs will not impair user comprehension because role-based users are trained staff or business operators who prefer speed over narrative instructions.
- Customer-facing screens (`app/(customer)`) already satisfy the user's requirements and must remain strictly untouched.
- High-contrast visual styling complies with standard mobile readability guidelines in direct outdoor sunlight.
