# Research: Comprehensive Portal Sidebar Audit & Page-by-Page Redesign

## 1. Route & Navigation Inventory

### A. Admin Portal Sidebar Routes (`buildAdminNav`)
| Group | Name | Route | Exists? | Current Status & Audit Finding |
| :--- | :--- | :--- | :---: | :--- |
| **Overview** | Dashboard | `/admin/dashboard` | Yes | Modernized in 001; verify all quick action cards link to real routes. |
| | Analytics | `/admin/analytics` | Yes | Legacy color cards; requires clean management card refactor & functional export buttons. |
| | Reports | `/admin/reports` | Yes | Needs clean date-range picker & functional report generation feedback. |
| **Operations** | Bookings | `/admin/bookings` | Yes | Modernized with `BookingDrawer`; ensure every drawer action links properly. |
| | Dispatch Engine | `/admin/settings?tab=general` | Yes | Routes to settings general tab; ensure tab opens directly to dispatch rules. |
| | Service Areas | `/admin/service-areas` | Yes | Needs interactive area drawer and polygon/district management. |
| **Trust & Safety** | Verification Queue | `/admin/verification` | Yes | Modernized with `VerificationDrawer`; verify approve/reject triggers. |
| | Compliance | `/admin/compliance` | Yes | Has `ComplianceDrawer`; ensure audit log links work. |
| | Disputes | `/admin/disputes` | Yes | Needs structured dispute drawer with active status transition buttons. |
| | Fraud Monitoring | `/admin/moderation` | Yes | Needs clean risk table and action modals for flagged accounts. |
| | Support Desk | `/admin/support` | Yes | Has `SupportDrawer`; verify ticket status changes and reply feedback. |
| **Marketplace** | Companies | `/admin/companies` | Yes | Modernized with `CompanyDrawer`; verify subpage `/admin/companies/[id]`. |
| | Users | `/admin/users` | Yes | Modernized with `UserDrawer`; verify edit and ban workflows. |
| | Staff | `/admin/staff` | Yes | Needs slideover drawer for staff background checks & assignments. |
| **Catalog & Growth** | Categories | `/admin/categories` | Yes | Modernized with `CategoryDrawer`; verify create & edit forms. |
| | Service Types | `/admin/service-types` | Yes | Has `ServiceTypeDrawer`; verify pricing and unit inputs. |
| | Campaigns | `/admin/broadcasts` | Yes | Needs clean campaign sender with real preview & sending feedback. |
| | Promo Codes | `/admin/promotions` | Yes | Needs promo creation drawer with code generator & expiry picker. |
| | Featured Listings | `/admin/featured` | Yes | Needs clean priority drag-and-drop or ranking table. |
| **Finance** | Transactions | `/admin/transactions` | Yes | Modernized data grid; verify receipt drawer & export button. |
| | Payouts | `/admin/payouts` | Yes | Has payout approval workflow; verify instant Bakong settlement feedback. |
| | Refunds | `/admin/refunds` | Yes | Needs refund dispute linking and approval confirmation dialog. |
| **Platform** | System Settings | `/admin/settings` | Yes | Needs tabbed quiet-luxury configuration cards. |
| | Monitoring | `/admin/monitoring` | Yes | Needs clean server health & database latency metrics. |
| | Email Settings | `/admin/emails` | Yes | Needs email template tester and SMTP status. |
| | Audit Logs | `/admin/audit` | Yes | Modernized audit trail; verify JSON payload inspector drawer. |

---

### B. Company Portal Sidebar Routes (`buildCompanyNav`)
| Group | Name | Route | Exists? | Current Status & Audit Finding |
| :--- | :--- | :--- | :---: | :--- |
| **Overview** | Dashboard | `/company/dashboard` | Yes | Modernized in 001; verify live metrics & quick actions. |
| | Analytics | `/company/analytics` | Yes | Needs clean P&L and service volume charts. |
| | Reports | `/company/reports` | Yes | Needs exportable monthly statement & staff commissions. |
| | Notifications | `/company/notifications`| Yes | Needs read/unread toggle & direct link to referenced booking. |
| | Messages | `/company/messages` | Yes | Has chat interface; verify send button & technician filter. |
| **Operations** | Dispatch Center | `/company/dispatch` | Yes | Modernized map/kanban; verify quick assign click. |
| | Bookings | `/company/bookings` | Yes | Modernized with `BookingDrawer`; verify customer detail links. |
| | Schedule | `/company/schedule` | Yes | Needs calendar day/week view with click-to-book drawer. |
| | Staff | `/company/staff` | Yes | Modernized with `StaffDrawer`; verify commission & skill tags. |
| **Business** | Services | `/company/services` | Yes | Modernized with `ServiceDrawer`; verify pricing inputs. |
| | Customers | `/company/customers` | Yes | Needs customer slideover drawer with booking history. |
| | Reviews | `/company/reviews` | Yes | Needs review response drawer & customer satisfaction rating. |
| | Disputes | `/company/disputes` | Yes | Needs company dispute resolution drawer. |
| **Finance** | Wallet | `/company/wallet` | Yes | Needs Bakong KHQR QR generator & cash-out request modal. |
| | Transactions | `/company/transactions` | Yes | Needs clean ledger with filterable settlement status. |
| | Revenue | `/company/revenue` | Yes | Needs monthly breakdown cards and payout velocity chart. |
| | Commission Rules | `/company/commission-rules` | Yes | Needs rule editor drawer with tier thresholds. |
| | Payouts | `/company/payouts` | Yes | Needs payout history and bank account verification banner. |
| **Settings** | Configuration | `/company/settings` | Yes | Needs company profile, logo upload, and working hours editor. |

---

## 2. Dead Button Audit & Remediation Strategy

### Root Causes of "Dead Buttons" in Web Management Portals
1. **Unwired Dummy Triggers**: UI buttons rendered with `onClick={() => {}}` or without `href` attributes, giving the impression of an action that produces zero response.
2. **Missing Slideover Drawer Connections**: Table rows or action icons that have no `onClick` attached, leaving the operator confused as to why clicking a row does nothing.
3. **Ghost Buttons in Drawers**: Secondary actions in drawer footers (e.g., "Download PDF", "Re-run AI Analysis", "Send SMS") that are not backed by any working endpoint.

### Strict Remediation Rules
- **Rule 1: If an action has no working target, DO NOT RENDER IT.** Strip dead buttons from headers, tables, and drawers.
- **Rule 2: Every action must produce immediate visual feedback within 100ms**:
  - Direct navigation: `<Link href="...">` or `router.push(...)`
  - Deep inspection: Open a contextual `SlideoverDrawer` with real data
  - State mutation: Trigger an interactive `ConfirmationDialog` or mutation with an immediate toast notification (`sonner` or `react-hot-toast`)
  - Filter/Sort update: Instant URL search param update or table re-filtering.
- **Rule 3: Table Row Clicks**: Clicking anywhere on a table row (or on its primary identifier) must open the corresponding record's slideover drawer or navigate to its detail route.

---

## 3. Monochromatic Quiet-Luxury Visual Upgrade Strategy

Following `app/auth/login/page.tsx` and `specs/001-clean-management-ui`:
- **Background**: Clean white (`bg-white`) for cards and tables; subtle gray canvas (`bg-slate-50`) for page shells.
- **Borders**: Subdued slate-200 (`border-slate-200`).
- **Typography**: Slate-900 headers (`text-slate-900 font-bold`), slate-500 secondary labels (`text-slate-500 text-xs`).
- **Cards**: Single standard `management-card` (border border-slate-200 bg-white rounded-xl shadow-xs).
- **Status Pills**: Standardized `StatusPill` with 4 strict variants:
  - `success` (Emerald) for Approved, Active, Settled, Completed
  - `warning` (Amber) for Pending, Reviewing, In Progress, Dispatched
  - `danger` (Rose) for Rejected, Banned, Disputed, Overdue
  - `neutral` (Slate) for Draft, Inactive, Archived, Closed
- **Buttons**:
  - Primary: `bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-lg shadow-sm`
  - Secondary/Outline: `border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs px-3.5 py-2 rounded-lg`
  - Destructive: `bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg`
