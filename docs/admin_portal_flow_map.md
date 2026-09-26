# 🗺️ Marketplace Admin Portal — Flow & Layout Mapping

This document maps out the layout structures, components, and interactive flows of the pages currently configured under the **Marketplace Admin Sidebar** (`/admin`). It acts as an audit guide to identify which pages are already standardized and which ones are unique candidates for future UX refits.

---

## 🧭 Admin Flow Matrix

The admin portal is divided into 7 functional navigation groups:

| Group | Page Name | Route | Current Layout | Actions & Flows | Status / Refit Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Overview** | Dashboard | `/admin/dashboard` | Custom Stats & Health Grid | Refresh analytics, view pending actions queue. | 🟢 Clean (Custom Grid) |
| | Analytics | `/admin/analytics` | Recharts tabs (`overview`, `revenue`, `bookings`, `marketplace`) | Dynamic date-range filters, CSV Export. | 🟢 Clean (Tabs Pattern) |
| | Reports | `/admin/reports` | Summary metrics & PDF Exports | Form filters, custom report generation. | 🟢 Clean (Form/List) |
| **Operations** | Bookings (List) | `/admin/bookings` | **Pattern 1:** DataGrid List | Click row ➡️ Opens `BookingDrawer`. Bulk actions: cancel/refund. | 🟢 Clean |
| | Bookings (Detail) | `/admin/bookings/[id]` | **Pattern 2:** Detailed Entity View | Sticky actions panel on the right. Modify status, assign staff, cancel/refund. | 🟢 Clean |
| | Dispatch Engine | `/admin/settings?tab=general` | **Pattern 3:** Tabs Config | Slider rule controls, save configurations. | 🟢 Clean |
| | Service Areas | `/admin/service-areas` | Custom Leaflet Map Grid | Draw boundary polygons, assign regional tags. | 🟢 Clean (Custom Map) |
| **Trust & Safety** | Verification Queue | `/admin/verification` | **Pattern 1:** DataGrid List | Click row ➡️ Opens `VerifyDrawer`. Bulk actions: approve/reject documents. | 🟢 Clean |
| | Compliance | `/admin/compliance` | **Pattern 1:** DataGrid List | Click row ➡️ Opens `ComplianceDrawer` (with inline rejection). | 🟢 Clean |
| | Disputes (List) | `/admin/disputes` | **Pattern 1:** DataGrid List | Click row ➡️ Opens `DisputeDrawer`. Quick refund/mediation actions. | 🟢 Clean |
| | Disputes (Detail) | `/admin/disputes/[id]` | **Pattern 2:** Detailed Mediation View | Compare evidence logs, photos, and release escrow/refund payouts. | 🟢 Clean |
| | Fraud Monitoring | `/admin/moderation` | Custom Grid of Flag Cards | Click card ➡️ Action Dialog (dismiss/remove flagged item). | 🟡 Medium Refit (Align header metrics) |
| | Support Desk | `/admin/support` | **Pattern 1:** DataGrid List | Click row ➡️ Opens Support Ticket Drawer. Bulk resolve/assign. | 🟢 Clean |
| | Reviews Audit | `/admin/reviews` | **Pattern 1:** DataGrid List | Audits stars ratings and custom comments logs. Row clicks slide review details. | 🟢 Clean |
| **Marketplace** | Companies (List) | `/admin/companies` | **Pattern 1:** DataGrid List | Click row ➡️ Opens `CompanyDrawer`. Quick verify/suspend. | 🟢 Clean |
| | Companies (Detail) | `/admin/companies/[id]` | **Pattern 2:** Detailed 360° Profile | Verify documents, manage coverage bounds, view transaction history. | 🟢 Clean |
| | Users (List) | `/admin/users` | **Pattern 1:** DataGrid List | Click row ➡️ Opens `UserDrawer`. Bulk suspend/delete. | 🟢 Clean |
| | Users (Detail) | `/admin/users/[id]` | **Pattern 2:** Detailed 360° Profile | Access customer/owner/staff profiles, edit account details. | 🟢 Clean |
| | Staff | `/admin/staff` | **Pattern 1:** DataGrid List | Click row ➡️ Opens `StaffDrawer`. View tracking, verify certifications. | 🟢 Clean |
| **Catalog & Growth** | Categories | `/admin/categories` | **Pattern 1:** DataGrid List | Click row ➡️ Opens Edit Category Drawer. Create category forms. | 🟢 Clean |
| | Service Types | `/admin/service-types` | **Pattern 1:** DataGrid List | Click row ➡️ Opens Edit Service Drawer. Setup checklist templates. | 🟢 Clean |
| | Campaigns | `/admin/broadcasts` | Custom layout (No DataGrid) | Click "New Campaign" ➡️ Opens standard input modal. | 🟡 Low Refit (Align headers) |
| | Promo Codes | `/admin/promotions` | **Pattern 1:** DataGrid List | Click row ➡️ Opens Edit Promo Drawer. Setup discount validation rules. | 🟢 Clean |
| | Featured Listings | `/admin/featured` | Custom Grid of Cards | Drag-and-drop sort order, configure active ad slots. | 🟢 Clean (Drag & Drop) |
| **Finance** | Transactions (List) | `/admin/transactions` | **Pattern 1:** DataGrid List | Click row ➡️ Opens transaction metadata details. | 🟢 Clean |
| | Transactions (Detail) | `/admin/transactions/[id]` | **Pattern 2:** Detailed Ledger View | View metadata, inspect callback logs, initiate Stripe/ABA refund. | 🟢 Clean |
| | Payouts | `/admin/payouts` | **Pattern 1:** DataGrid List | Click row ➡️ Opens bank details. Bulk cashout authorize. | 🟢 Clean |
| | Refunds | `/admin/refunds` | Custom table layout | Search refund logs, view Stripe/ABA callback responses. | 🟡 Low Refit (Table alignments) |
| **Platform Settings** | System Settings | `/admin/settings?tab=general` | **Pattern 3:** Tabs layout | Key-value settings form fields. | 🟢 Clean |
| | Email Settings | `/admin/emails` | Custom WYSIWYG form layout | Compose transactional templates, edit SMTP keys. | 🟢 Clean (Custom Editor) |
| | Integrations | `/admin/settings?tab=integrations`| **Pattern 3:** Tabs layout | Toggle API credentials for Stripe, PayWay, Twilio. | 🟢 Clean |
| | Audit Logs | `/admin/audit` | **Pattern 1:** DataGrid List | Inspect detailed system logs, user actions. | 🟢 Clean |
