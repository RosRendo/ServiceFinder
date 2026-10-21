# Feature Specification: Universal Management Hierarchy Flow

**Feature Branch**: `005-portal-hierarchy-flow`  
**Created**: 2026-10-04  
**Status**: Draft  
**Input**: User request: "/speckit-specify how about hirachy flow? is it overal ? click on it show drawer and show detail like this can you check all?"

---

## 1. Executive Summary & Objective

The ServiceFinder platform operates with complex administrative and partner operations across hundreds of entities (Bookings, Organizations, Users, Compliance, Disputes, Payouts, Catalog items). 

To eliminate cognitive friction, avoid jarring full-page redirects, and ensure rapid operational triage, the platform must enforce a **Universal 3-Tier Interaction Hierarchy Flow** across all list and management views:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 1: Global Navigation (Sidebar & Unified Command Center)                │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 2: Entity Directory (Standardized DataGrid)                            │
│ • Real-time KPIs strip, search bar, status filter pills, batch actions.     │
│ • Row interaction: Clicking a row does NOT trigger a full page redirect.    │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      ▼ [Row Click]
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 3: Fast Inspection Slide-Over Drawer (BaseDrawer)                      │
│ • Opens instantly (300ms spring slide from right).                         │
│ • Context preservation: Background list remains visible & interactive.     │
│ • Contains: Entity summary, quick actions (Approve, Suspend, Assign, Edit). │
│ • Prominent Primary Action: "View Full Profile ↗" or "Open 360° View ↗".   │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      ▼ [Explicit Deep Action]
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 4: Dedicated 360° Entity Profile (`/[entity]/[id]`)                    │
│ • Full viewport dedicated to heavy auditing, audit logs, and photo proofs.  │
│ • Sticky header with breadcrumbs back to Tier 2 list.                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Complete Admin Portal Flow Audit & Current Status

Auditing all 27 admin modules reveals which pages currently comply with the 3-Tier hierarchy, which have disconnected drawers, and which require refits:

| Category | Route | Current State | Audit Finding & Action Required | Target Hierarchy |
| :--- | :--- | :--- | :--- | :--- |
| **Operations** | `/admin/bookings` | 🟡 Disconnected | Has `BookingDrawer` in codebase, but `onRowClick` performs `router.push`! Must wire `BookingDrawer` to `onRowClick`. | DataGrid ➡️ BookingDrawer ➡️ `/admin/bookings/[id]` |
| | `/admin/bookings/[id]` | 🟢 Compliant | Sticky actions right rail, staff assign, timeline. | Dedicated 360° View |
| | `/admin/service-areas` | 🟢 Compliant | Leaflet map boundary editor. Uses `ServiceAreaDrawer`. | Map Grid ➡️ ServiceAreaDrawer |
| **Trust & Safety** | `/admin/verification` | 🟡 Disconnected | Uses modal instead of slide-over drawer. Needs alignment with `CompanyDrawer` verification tab. | DataGrid ➡️ VerifyDrawer ➡️ Company Profile |
| | `/admin/compliance` | 🟢 Compliant | Uses `ComplianceDrawer`. | DataGrid ➡️ ComplianceDrawer |
| | `/admin/disputes` | 🟢 Compliant | Uses `DisputeDrawer`. Contains "Open Mediation Room ↗". | DataGrid ➡️ DisputeDrawer ➡️ `/admin/disputes/[id]` |
| | `/admin/disputes/[id]`| 🟢 Compliant | Full mediation desk with escrow release. | Dedicated 360° View |
| | `/admin/moderation` | 🔴 Non-Compliant | Card grid with alert dialogs. Needs standard DataGrid + ModerationDrawer. | DataGrid ➡️ ModerationDrawer |
| | `/admin/support` | 🟢 Compliant | Uses `SupportDrawer`. | DataGrid ➡️ SupportDrawer |
| | `/admin/reviews` | 🟢 Compliant | Uses `ReviewDrawer`. | DataGrid ➡️ ReviewDrawer |
| **Marketplace** | `/admin/companies` | 🟡 Disconnected | Has `CompanyDrawer` in codebase, but `onRowClick` calls `router.push`. Must wire `CompanyDrawer`. | DataGrid ➡️ CompanyDrawer ➡️ `/admin/companies/[id]` |
| | `/admin/companies/[id]`| 🟢 Compliant | Full 360° merchant profile. | Dedicated 360° View |
| | `/admin/users` | 🟢 Compliant | DataGrid with `UserDrawer`. Has "View Full Profile ↗". | DataGrid ➡️ UserDrawer ➡️ `/admin/users/[id]` |
| | `/admin/users/[id]` | 🟢 Compliant | Customer & staff 360° profile. | Dedicated 360° View |
| | `/admin/staff` | 🟢 Compliant | Uses `StaffDrawer`. | DataGrid ➡️ StaffDrawer |
| **Catalog & Growth** | `/admin/categories` | 🟢 Compliant | Self-contained: DataGrid with `CategoryDrawer` for edit/create. | DataGrid ➡️ CategoryDrawer (Self-contained) |
| | `/admin/service-types` | 🟢 Compliant | Self-contained: DataGrid with `ServiceTypeDrawer`. | DataGrid ➡️ ServiceTypeDrawer (Self-contained) |
| | `/admin/broadcasts` | 🔴 Non-Compliant | Custom cards with basic modal. Needs DataGrid + CampaignDrawer. | DataGrid ➡️ CampaignDrawer |
| | `/admin/promotions` | 🟢 Compliant | Uses `PromoDrawer`. | DataGrid ➡️ PromoDrawer (Self-contained) |
| | `/admin/featured` | 🟡 Custom Grid | Drag & drop card slots. Needs quick edit drawer on card click. | Card Grid ➡️ SlotDrawer |
| **Finance** | `/admin/transactions` | 🟢 Compliant | DataGrid with transaction metadata inspection. | DataGrid ➡️ TransactionDrawer ➡️ `/admin/transactions/[id]` |
| | `/admin/payouts` | 🟢 Compliant | Uses payout ledger drawer. | DataGrid ➡️ PayoutDrawer |
| | `/admin/refunds` | 🔴 Non-Compliant | Custom table missing standardized DataGrid & Drawer. | DataGrid ➡️ RefundDrawer |
| **Settings & Audits** | `/admin/audit` | 🟢 Compliant | DataGrid with JSON log payload inspection drawer. | DataGrid ➡️ AuditLogDrawer |

---

## 3. User Scenarios & Testing *(mandatory)*

### User Story 1 - Rapid Row Triage Without Context Loss (Priority: P1)
As an administrative operator reviewing pending items (bookings, companies, disputes), I want to click any row in the DataGrid to instantly open a right-side drawer with essential entity details and quick actions, so that I can approve, reject, or assign without leaving my filtered table view.

* **Why this priority**: Core operational velocity. Operators spend 80% of their workday reviewing list items; full-page redirects destroy flow and reset scroll/filter states.
* **Independent Test**: Clicking any row on `/admin/bookings` or `/admin/companies` immediately opens `BookingDrawer` or `CompanyDrawer` while the table remains visible underneath.
* **Acceptance Scenarios**:
  1. **Given** an operator is on `/admin/bookings` filtered by `status=pending`, **When** they click a booking row, **Then** `BookingDrawer` slides in from the right with booking details and staff assignment options.
  2. **Given** the drawer is open, **When** the operator updates status or assigns staff, **Then** the drawer reflects the update, closes, and the background table refreshes smoothly.
  3. **Given** the operator clicks the drawer backdrop or presses `Esc`, **Then** the drawer closes without altering table pagination or search query.

---

### User Story 2 - Smooth Escalation to 360° Dedicated View (Priority: P2)
As an administrator who discovers an edge case in the quick inspection drawer, I want a prominent "Open Full Profile ↗" action in the drawer header/footer to navigate directly to the dedicated 360° entity page (`/[entity]/[id]`).

* **Why this priority**: Bridges the gap between fast triage (90% of cases) and deep investigative audits (10% of cases).
* **Independent Test**: Opening any drawer and clicking the external link button navigates cleanly to `/[entity]/[id]`.
* **Acceptance Scenarios**:
  1. **Given** `CompanyDrawer` is open for "ProClean Cambodia", **When** the admin clicks "View Full Organization ↗", **Then** the browser navigates to `/admin/companies/[id]` with breadcrumb back to `/admin/companies`.
  2. **Given** `BookingDrawer` is open, **When** the admin clicks "Open Order Desk ↗", **Then** the browser navigates to `/admin/bookings/[id]`.

---

### User Story 3 - Self-Contained Management for Configuration Entities (Priority: P3)
As an administrator managing catalog taxonomies (Categories, Service Types, Promo Codes), I want the drawer to be the complete management interface (Edit, Delete, Toggle Status) without creating unnecessary dedicated child pages.

* **Why this priority**: Avoids over-architecting simple CRUD configurations into unnecessary page routes.
* **Independent Test**: Categories and Promos are completely editable and creatable entirely within their respective slide-over drawers.
* **Acceptance Scenarios**:
  1. **Given** an admin clicks a category row on `/admin/categories`, **Then** `CategoryDrawer` opens allowing inline name edits, icon assignment, and fee rule adjustments, saving directly to the API.

---

## 4. Requirements *(mandatory)*

### Functional Requirements

* **FR-001**: Every list/table page in the portal MUST implement `ManagementDataGrid` or `DataGrid`.
* **FR-002**: Clicking any row in the DataGrid MUST fire `onRowClick(entity)` and open the corresponding entity slide-over `Drawer`.
* **FR-003**: Checkbox selection for batch actions MUST NOT trigger row drawer opening (event propagation strictly stopped).
* **FR-004**: All drawers MUST extend `BaseDrawer` to guarantee uniform animation (300ms spring slide), consistent close buttons, backdrop blur, and accessible focus traps.
* **FR-005**: Drawers for complex entities (Bookings, Companies, Users, Disputes, Transactions) MUST include a prominent "View Full Details ↗" link targeting `/admin/[entity]/[id]`.
* **FR-006**: Self-contained drawers (Categories, Service Types, Promo Codes) MUST contain save/update actions and mutate state via REST API with toast feedback.
* **FR-007**: When a drawer mutates an entity (e.g. status change, staff assignment, suspension), it MUST invoke `onSuccess()` to refresh the background DataGrid silently without reloading the browser.
* **FR-008**: Closing a drawer MUST preserve the current DataGrid page index, search query, and filter pill state.
* **FR-009**: Keyboard accessibility: Pressing `Esc` MUST dismiss the open drawer. Pressing `Enter` on a focused row MUST open the drawer.
* **FR-010**: Mobile fallback: On screens narrower than 768px, drawers MUST adapt to full-screen sheets or bottom-sheet modals with tactile swipe-to-dismiss.
* **FR-011**: Disconnected drawers on `/admin/bookings` and `/admin/companies` MUST be wired to replace existing direct redirects.
* **FR-012**: Non-compliant pages (`/admin/moderation`, `/admin/broadcasts`, `/admin/refunds`) MUST be migrated from ad-hoc cards/modals into the standardized DataGrid + Drawer pattern.

---

## 5. Success Criteria *(mandatory)*

1. **100% Pattern Uniformity**: 100% of entity list pages in the admin portal follow the exact same interaction flow: *Row click opens Drawer; Drawer offers quick triage or links to Full Profile*.
2. **Context Preservation**: 0% loss of table filters, search queries, or scroll position when inspecting items.
3. **Zero Accidental Redirects**: Clicking a table row never triggers an unexpected full-page load.
4. **Sub-100ms Drawer Response**: Slide-over animation initiates immediately with zero perceived lag.
5. **Clear Hierarchy**: Every Drawer clearly communicates whether it is self-contained or has a full 360° companion page.
