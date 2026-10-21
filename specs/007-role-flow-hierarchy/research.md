# Research: Role Flow Hierarchy Validation & Optimization

**Feature**: `specs/007-role-flow-hierarchy`  
**Date**: 2026-10-05  
**Domain**: Multi-Role Marketplace Flow & Ergonomics (Field Staff, Company Dispatch, Platform Admin)

---

## 1. Role Workspace Routing & State Isolation

### Decision
Enforce strict physical layout boundaries at `frontend-expo/app/(staff)`, `frontend-expo/app/(company)`, and `frontend-expo/app/(admin)` backed by Expo Router's group routing and an authenticated role redirect gate in `frontend-expo/app/_layout.tsx`. Each role must maintain its own dedicated tab navigator, independent Zustand state slice, and cache invalidation policies to avoid cross-role state leakage.

### Rationale
- Mixing operational tabs (e.g., Company dispatch controls inside a Field technician's daily view) causes cognitive overload and permission violation risks.
- Role switching or impersonation must trigger an atomic cache reset and route replacement (`router.replace`) to guarantee that cached tokens, stale booking lists, or unremitted cash amounts do not persist into unauthorized views.
- Deep links (push notifications for new job assignments or customer disputes) must route directly into the target role's sub-route only if the active token matches the required role.

### Alternatives Considered
- *Single dynamic tab navigator adapting icons based on user role*: Rejected because it increases bundle entanglement, complicates tab lifecycle management, and creates brittle conditional rendering inside a single 100KB+ component.
- *Web-only admin console with mobile-only staff/customer*: Evaluated, but maintaining a mobile admin view is critical for emergency triage, SLA queue alerts, and urgent dispute freezes while managers are on the move.

---

## 2. Field Technician Daily Itinerary & Job Lifecycle Progression

### Decision
Standardize the on-field job lifecycle into a 5-stage unidirectional progression:
`Assigned / Confirmed` $\rightarrow$ `En Route` $\rightarrow$ `Arrived` $\rightarrow$ `In Progress` $\rightarrow$ `Completed`

Integrate offline-first state tracking with local optimistic updates:
1. **One-Tap Action Bar**: The active job card always exposes the single next primary action prominently (e.g., "Tap to Depart" when Confirmed, "I Have Arrived" when En Route, "Start Work" when Arrived, "Complete Job" when In Progress).
2. **Turn-by-Turn Shortcut**: One-tap deep link to Google Maps / Apple Maps / Waze using coordinates (`latitude`, `longitude`).
3. **Proof of Completion**: Mandatory photo capture and optional notes before marking `Completed`.
4. **Offline Queue Sync**: If network drops on site, timestamp and status transitions are recorded in local AsyncStorage and replayed immediately upon connectivity restoration.

### Rationale
- On-demand marketplace workers (similar to logistics fleet drivers or field dispatch technicians) operate in high-pressure, mobile environments. Cluttered UI with dropdowns or multi-step forms causes high friction, delayed milestone logging, and inaccurate customer ETA calculations.
- Having a single, high-contrast, thumb-friendly primary action button minimizes driver distraction and mistakes.

### Alternatives Considered
- *Allowing technicians to skip directly from `Confirmed` to `Completed`*: Rejected because customers lose live ETA tracking, and dispute arbitration lacks arrival timestamps.
- *Requiring OTP verification from customer before starting*: Kept as optional configuration; forcing OTP in all home services creates friction if customers are busy or elderly, but photo proof of work is universally reliable.

---

## 3. Company Dispatch Operations & Rapid Pro Allocation

### Decision
Implement a dual-mode dispatch board in `(company)/(tabs)/operations.tsx`:
1. **Unassigned Queue**: Instant and direct bookings requiring pro allocation, highlighted with remaining SLA countdown timers and service category badges.
2. **Pro Radar & 1-Tap Allocation Modal**: When a dispatcher taps "Assign Staff", the modal lists company technicians sorted by:
   - Proximity to customer location (calculated via Haversine distance from technician's last reported coordinates).
   - Current availability status (`active` / on shift vs. `offline`).
   - Active job count (workload balancing).
3. **Real-time Status Sync**: Dispatch status updates propagate via WebSockets (`BookingsGateway`) and fallback polling.

### Rationale
- High-efficiency dispatchers handle dozens of incoming bookings per hour. Having pro proximity and workload visibly grouped prevents scheduling conflicts and minimizes travel time for field workers.
- Mirrors successful dispatcher tooling in transport and field service management (FSM).

### Alternatives Considered
- *Fully automated algorithmic dispatch without human dispatcher confirmation*: Useful for instant rides, but home services often require verifying specialized equipment, technician skill certifications, and specific customer requests. Hybrid human-in-the-loop dispatch with smart recommendations is the superior pattern.

---

## 4. Cash Reconciliation & Financial Auditing

### Decision
Provide explicit physical cash collection tracking per booking:
1. Field technician marks `Cash Collected: $XX.XX` upon job completion.
2. The amount is debited to the technician's `unremittedCashBalance` and credited to the company's `pendingRemittance` account.
3. If a pro's unremitted balance exceeds the company credit limit (e.g., $100), the system displays a prominent banner and disables further cash-on-delivery dispatches until the pro reconciles cash with the company office or submits digital proof of transfer.
4. Company Admin's `Finance` tab provides a dedicated "Cash Audit" drawer with one-tap "Mark Cash Remitted / Settled".

### Rationale
- In Southeast Asia and emerging markets, Cash On Delivery (COD) remains a major payment channel. Lack of strict pro cash tracking causes significant revenue leakage and disputes between companies and contractors.
- Automated balance tracking provides transparent accountability for both the worker and the business owner.

### Alternatives Considered
- *Digital-only payment enforcement*: Excludes a substantial segment of customers who prefer cash on delivery.
- *Informal off-platform cash reconciliation*: Causes accounting discrepancies, tax reporting issues, and unresolvable worker disputes.

---

## 5. Platform Superadmin Quality & Dispute Governance

### Decision
Structure the Admin workspace into clear operational lanes:
1. **Queue Monitor (`/queue`)**: High-priority real-time stream of unassigned requests across all companies exceeding 15-minute response thresholds, with manual override or re-routing options.
2. **Company Vetting (`/companies`)**: Two-column verification review (business license, identity credentials, contact details) with one-click "Verify & Activate", "Request Additional Info", or "Reject with Reason".
3. **Dispute Resolution (`/issues`)**: Consolidated case docket displaying customer claim, provider rebuttal, photo evidence, payment transaction record, and one-click arbitration actions (Full Refund to Customer, Split Settlement, or Release Escrow to Provider).

### Rationale
- Platform admins are custodians of trust and marketplace integrity. They require actionable dashboards focused on anomalies, SLA breaches, and contentious disputes rather than everyday business operations.

### Alternatives Considered
- *Generic CRUD admin table for everything*: Creates sluggish workflows where critical disputes and onboarding requests get buried under thousands of routine records.
