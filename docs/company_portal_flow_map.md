# 🗺️ B2B Company Portal — Flow & Layout Mapping

This document maps out the layout structures, components, and interactive flows of the pages currently configured under the **B2B Company Portal Sidebar** (`/company`) on web. It acts as an audit guide to identify page structures, route directories, and components for future redesigns.

---

## 🧭 B2B Company Flow Matrix

The B2B portal is divided into 5 functional navigation groups:

| Group | Page Name | Route | Current Layout | Actions & Flows | Status / Refit Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Overview** | Dashboard | `/company/dashboard` | Custom Stats & Health Grid | Real-time KPI summaries, online technician lists, unassigned alerts. | 🟢 Clean (Custom Grid) |
| | Analytics | `/company/analytics` | Recharts Visual Analytics | Graphing splits, completed checkouts, retention metrics. | 🟢 Clean (Tabs Pattern) |
| | Reports | `/company/reports` | Summary metrics & PDF Exports | Form filters, custom report generation. | 🟢 Clean (Form/List) |
| | Notifications | `/company/notifications` | DataGrid list | Renders alerts (bookings matches, payout confirmations). | 🟢 Clean |
| | Messages | `/company/messages` | Split Chat Pane | Active chat lines list. Clicks route to room details. | 🟢 Clean |
| **Operations** | Dispatch Center | `/company/dispatch` | Custom Leaflet Map Grid | Command center: Auto Match, manual routing, live technician GPS coordinates. | 🟢 Clean (Custom Map) |
| | Bookings (List) | `/company/bookings` | DataGrid list | Standard bookings grid. Tab filters. Row click opens BookingDrawer. | 🟢 Clean |
| | Bookings (Detail) | `/company/bookings/[id]` | Detailed Entity View | Job stepper checkpoints, photo uploads, invoice details, client chat logs. | 🟢 Clean |
| | Schedule | `/company/schedule` | Scheduler Layout | Daily/Weekly/Monthly calendar matrix displaying slots assignments. | 🟢 Clean |
| | Staff Management | `/company/staff` | DataGrid list | Employee roster. Click row opens StaffDrawer. Invite staff. | 🟢 Clean |
| | Staff Detail | `/company/staff/[id]` | Detailed Entity View | Performance metrics dashboard, shifts config, commission rates. | 🟢 Clean |
| **Business** | Services Catalog | `/company/services` | DataGrid list | Category packages tiers (Basic, Standard, Premium) CRUD list. | 🟢 Clean |
| | Customers CRM | `/company/customers` | DataGrid list | Customer lists showing spend, chat redirects. | 🟢 Clean |
| | Reviews Audit | `/company/reviews` | DataGrid list | Star feedback logs. Opens ReviewDrawer. | 🟢 Clean |
| | Disputes Queue | `/company/disputes` | DataGrid list | Lists customer dispute complaints. Redirects to details/[id]. | 🟢 Clean |
| | Disputes (Detail) | `/company/disputes/[id]` | Detailed Entity View | Submit proof counter-evidence (upload photos, checklists, GPS logs). | 🟢 Clean |
| | Coverage Areas | `/company/areas` | Custom Leaflet Map Grid | Configure geographic matching circles and operation bounds. | 🟢 Clean |
| | Marketing | `/company/marketing` | Custom Cards Grid | Set peak/off-peak surcharges, visibility boosting sliders. | 🟢 Clean |
| | Pricing | `/company/pricing` | Package Comparison Grid | SaaS plans levels (Trial vs Pro) validation. | 🟢 Clean |
| | Help & Support | `/company/support` | DataGrid list | B2B support tickets desk log connecting to platform admins. | 🟢 Clean |
| **Finance** | Wallet Overview | `/company/wallet` | Custom Wallet Grid | Cashout console. Requests withdrawals via KHQR scan. | 🟢 Clean |
| | Transactions Ledger| `/company/transactions` | DataGrid list | Immutable ledger log. CSV reports export. | 🟢 Clean |
| | Revenue Reports | `/company/revenue` | Recharts Visual Analytics | Graphs monthly performance cycles splits. | 🟢 Clean |
| | Commission Rules | `/company/commission-rules` | DataGrid list | Splits details parameters. Save commission splits. | 🟢 Clean |
| | Payouts History | `/company/payouts` | DataGrid list | Withdrawal history ledger status details (Pending, Paid, Failed). | 🟢 Clean |
| **Settings** | Profile & Configuration | `/company/settings` | Tabs config form | Edit company info (logo, cover, business hours). | 🟢 Clean |
