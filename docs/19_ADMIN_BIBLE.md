# 19. Admin Role Bible
**Module:** `(admin)`
**Status:** 10/10 Enterprise Grade

This document serves as the absolute source of truth for the Admin Module. It covers deep business logic, security protocols, and 18-point behavioral specifications for every admin screen.

---

## PART 1: Core System Flows

### 1. Verification Flow (Companies)
**Trigger:** Company submits onboarding documents.
1. **Pending Status:** Company placed in `verification_queue`. Account locked from receiving bookings.
2. **Admin Review:** Admin reviews Business License, Tax ID, and Identity.
3. **Approve:** Company unlocked -> Receives Welcome Email -> Listed in Customer search.
4. **Reject:** Admin selects reason -> Email sent to Company to re-upload -> Status remains pending.
5. **Appeal System:** Companies can appeal rejections via a built-in messaging thread.

### 2. Refund Flow
**Trigger:** Dispute created or Customer requests cancellation.
1. **Manual Assessment:** Admin reviews Customer Claim vs. Company Response.
2. **Partial Refund:** Admin enters specific `$ amount`.
3. **Full Refund:** Admin selects 100% refund.
4. **Processing Fee:** Platform fee is optionally absorbed by the platform or passed to the company.
5. **Admin Approval:** Any refund > $500 requires a secondary Super Admin PIN to execute.

### 3. Fraud System & Security
**Trigger:** Continuous background monitoring.
1. **Suspicious Activities:** Tracks multi-account creation from single IP, rapid failed logins, or unusually high refund requests.
2. **Fraud Score:** AI assigns a score (1-100). If > 80, account automatically suspended pending manual review.
3. **Rate Limits:** Maximum 5 login attempts / hour. Maximum 3 password resets / day.
4. **Audit Log:** EVERY action taken by an Admin (suspending user, issuing refund, changing commission) is logged immutably with Timestamp, IP, and Admin ID.

### 4. Commission System
**Trigger:** Payout generation.
1. **Standard Rate:** 15% platform fee deducted from every successful booking.
2. **Dynamic Rates:** High-performing companies can have their rate manually lowered by Admins to 10%.
3. **Processing Fees:** Stripe processing fees (2.9% + 30¢) are calculated and explicitly shown in Admin dashboards.

### 5. Analytics & Reports
1. **Metrics:** Daily Revenue, New User Acquisition, Retention Rate, Commission Earned, System Growth.
2. **Exports:** Every data table supports exporting to `.CSV` and `.PDF`.

---

## PART 2: Screen Specifications (18-Point Format)

### Screen: Admin Dashboard (`admin/(tabs)/dashboard.tsx`)

**PAGE SPECIFICATION**
1. **Purpose:** Master control center to view platform health and immediately action high-priority alerts.
2. **Layout:** Web-first responsive grid. Sidebar navigation (Desktop) or Hamburger Drawer (Mobile).
3. **Components:** Revenue Hero Chart, Alerts Widget (Fraud/Disputes), KPI Grid.
4. **Buttons:** "Export Monthly Report" (Primary), "Review Dispute" (Secondary).
5. **User Interaction Flow:**
   * Admin lands on dashboard -> Views AI Fraud Alerts -> Taps "Review User" -> Opens User modal -> Reads Audit Log -> Suspends User -> Submits.
6. **Business Logic:**
   * Dashboard KPIs strictly cache for 5 minutes to reduce database load.
7. **Permissions:** Admin, Super Admin.
8. **API Integration:** `GET /api/admin/kpis`, `GET /api/admin/alerts`
9. **Notifications:** WebSocket live ticker for major events (e.g., ">$1,000 booking made").
10. **Loading State:** Skeleton grids for all KPI cards.
11. **Empty State:** N/A
12. **Error State:** "Failed to load Analytics. Check database connection."
13. **Warning State:** "High server load detected. Non-essential queries paused."
14. **Micro Animations:** Revenue counter ticks up dynamically on load.
15. **AI Features:** AI Insights widget ("Revenue is up 12% compared to last Tuesday. Mostly driven by Plumbing services.").
16. **Design Constraints:** Sidebar must collapse to icons-only on tablets.
17. **Page Relationships:** Connects directly to Users, Companies, Disputes, and Analytics.
18. **Future Features:** Live geographic heatmaps of active bookings.

---

### Screen: User Management (`admin/users/index.tsx` & `[id].tsx`)

**PAGE SPECIFICATION**
1. **Purpose:** Manage customer accounts, intervene in disputes, and enforce security policies.
2. **Layout:** Searchable/Sortable Data Table. Detail page uses Stack navigation.
3. **Components:** Advanced Search Bar, Status Filter Chips, User Audit Table.
4. **Buttons:** "Suspend User", "Ban User" (Danger), "Restore User", "Reset 2FA", "Send Warning".
5. **User Interaction Flow:**
   * Admin taps "Suspend" -> Prompted for duration (24h, 7d, Permanent) & Reason -> Admin confirms -> User token revoked instantly -> Email sent to User.
6. **Business Logic:**
   * Banned users cannot re-register with the same email or phone number.
   * Suspension automatically cancels all of the user's upcoming bookings (without penalty to company).
7. **Permissions:** Admin.
8. **API Integration:** `GET /api/admin/users`, `PATCH /api/admin/users/:id/suspend`
9. **Notifications:** Email sent to user outlining reason for suspension/warning.
10. **Loading State:** Table skeleton rows.
11. **Empty State:** "No users found matching filters."
12. **Error State:** Toast: "Failed to update user status."
13. **Warning State:** "This user has an active booking. Suspending them will cancel it."
14. **Micro Animations:** Status badge flips from Green (Active) to Red (Suspended) on successful action.
15. **AI Features:** AI Fraud Score clearly visible next to user's name (1-100).
16. **Design Constraints:** Table must support horizontal scroll on mobile to avoid squishing columns.
17. **Page Relationships:** Affects -> Customer Login, Booking Lifecycle, Authentication.
18. **Future Features:** Identity verification (KYC) for specific high-value customers.

---

### Screen: Company Verification & Management (`admin/companies/index.tsx`)

**PAGE SPECIFICATION**
1. **Purpose:** Gatekeep platform quality, verify documents, and adjust commission rates.
2. **Layout:** Split Kanban Board for Verification Queue (Pending, Reviewing, Approved, Rejected).
3. **Components:** PDF Document Viewer, Commission Rate Slider, History Timeline.
4. **Buttons:** "Approve Company", "Reject Documents", "Adjust Commission".
5. **User Interaction Flow:**
   * Admin opens Pending Company -> Views uploaded PDF -> Selects "Reject Documents" -> Types reason ("ID expired") -> Company notified -> Status moved to Rejected.
6. **Business Logic:**
   * Company cannot receive payouts or accept bookings until `verified_at` timestamp is set.
7. **Permissions:** Admin.
8. **API Integration:** `GET /api/admin/companies`, `POST /api/admin/companies/:id/verify`
9. **Notifications:** Push and Email to Company Admin regarding verification status.
10. **Loading State:** Loading spinner overlaying document viewer.
11. **Empty State:** "No companies pending verification! Good job."
12. **Error State:** "Failed to load PDF document."
13. **Warning State:** N/A
14. **Micro Animations:** Drag-and-drop animations for moving companies between Kanban columns.
15. **AI Features:** OCR (Optical Character Recognition) automatically reads uploaded licenses and flags discrepancies with registered name.
16. **Design Constraints:** Document viewer must support pinch-to-zoom.
17. **Page Relationships:** Affects -> Company Dashboard, Search Engine Indexing.
18. **Future Features:** Automated background checks via 3rd party API.

---

### Screen: Refund & Financials (`admin/refunds.tsx`)

**PAGE SPECIFICATION**
1. **Purpose:** Manually process complex refunds and review automated payouts.
2. **Layout:** Dual-pane layout. Left: Dispute/Refund Queue. Right: Financial Details & Action Pane.
3. **Components:** Stripe Status Indicator, Amount Input Field, Dispute Chat History.
4. **Buttons:** "Issue Full Refund", "Issue Partial Refund", "Request Super Admin Approval".
5. **User Interaction Flow:**
   * Admin selects Partial Refund -> Enters `$50.00` -> Chooses who absorbs fee (Platform vs Company) -> Clicks Submit -> Confirms via PIN -> Stripe processes.
6. **Business Logic:**
   * Refunds deduct immediately from Company Escrow. If Escrow is $0, it deducts from future payouts (Negative Balance).
7. **Permissions:** Super Admin required for execution. Standard Admin read-only.
8. **API Integration:** `POST /api/admin/refunds/execute`
9. **Notifications:** Email receipt of refund sent to Customer.
10. **Loading State:** "Processing with Stripe..." spinner overlay.
11. **Empty State:** "No pending refund requests."
12. **Error State:** "Stripe Error: Insufficient funds in connected account."
13. **Warning State:** "Warning: You are refunding an amount greater than the original platform fee."
14. **Micro Animations:** Green checkmark explosion on successful refund API return.
15. **AI Features:** N/A
16. **Design Constraints:** Monetary inputs must restrict to 2 decimal places and lock out non-numeric characters.
17. **Page Relationships:** Affects -> Customer Wallet, Company Analytics, Platform Commission Analytics.
18. **Future Features:** Crypto/Stablecoin refund execution routing.
