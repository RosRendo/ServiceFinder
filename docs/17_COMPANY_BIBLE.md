# 17. Company Role Bible
**Module:** `(company)`
**Status:** 10/10 Enterprise Grade

This document serves as the absolute source of truth for the Company Module. It defines the business logic for managing bookings, staff dispatch, and revenue, adhering strictly to the 18-Point Page Specification format.

---

## PART 1: Core System Flows

### 1. Booking Flow (Queue Management)
**Trigger:** Customer creates a new booking.
1. **Pending State:** Booking enters the "Queue" tab. Company Admin receives push notification. Stripe places a pre-authorization hold on the customer's card.
2. **Acceptance Rules:** Company must Accept or Decline within 2 hours (SLA). 
   - **Accept:** Booking moves to "Upcoming". Pre-auth hold is captured.
   - **Decline:** Admin must select a reason. Customer pre-auth is released. Repeated declines negatively impact the company's visibility ranking.
3. **Auto-Assignment:** If enabled, the system automatically assigns the closest available staff member based on their `active` status and GPS location.

### 2. Revenue & Escrow Flow
**Trigger:** Booking is Accepted.
1. **Escrow Hold:** Funds are held in a virtual Escrow account. They do not hit the Company's available wallet balance yet.
2. **Job Completion:** Once the assigned Staff completes the job (requires GPS + photo proof), the funds are released from Escrow.
3. **Platform Fee:** The system automatically deducts the platform commission (e.g., 15%) + Stripe processing fee (2.9% + 30¢) before crediting the Company's `walletBalance`.

### 3. Payout Flow
**Trigger:** Company requests to withdraw funds.
1. **Automated (Stripe Connect):** Payouts are automatically routed to the company's connected bank account every 7 days.
2. **Manual Payout:** Company can manually request a payout of their available balance at any time (requires $50 minimum balance).
3. **Negative Balance:** If refunds exceed revenue, the wallet goes negative, and future earnings automatically offset the debt.

### 4. Staff Flow & Dispatch
**Trigger:** Company hires a new employee.
1. **Invitation:** Admin enters employee email/phone. Employee receives a deep link to download the app and register as `staff`.
2. **Role Assignment:** Staff are assigned as `worker` or `manager`. Managers can reassign jobs in the field.
3. **Live GPS Tracking:** While on the clock (Active status), staff locations are updated via WebSockets so the Company Admin (and Customer) can track them on the map.

### 5. Analytics Flow
**Trigger:** Dashboard load.
1. **Metrics Computed:** Total Revenue (after fees), Staff Utilization Rate (Jobs completed / Staff hours), Booking Conversion Rate.
2. **Data Export:** Admins can export monthly earnings and tax summaries as CSV/PDF.

---

## PART 2: Screen Specifications (18-Point Format)

### Screen: Company Dashboard (`(company)/(tabs)/dashboard.tsx`)

**PAGE SPECIFICATION**
1. **Purpose:** High-level overview of daily business operations and immediate action items.
2. **Layout:** Split view. Top: Financial KPIs and Revenue Chart. Bottom: Urgent Action Queue (Pending jobs, Unassigned staff).
3. **Components:** Revenue Line Chart, KPI Cards (Escrow, Available, Completed), Actionable List Items.
4. **Buttons:** "Accept Job" (Green), "Decline Job" (Red).
5. **User Interaction Flow:**
   * Admin opens app -> Sees 1 Pending Request -> Swipes right on request to Accept -> Card collapses with success animation -> Balance updates.
6. **Business Logic:**
   * Only bookings for *today* or requiring immediate SLA attention appear in the urgent queue.
7. **Permissions:** Company Admin.
8. **API Integration:** `GET /api/companies/metrics`, `GET /api/bookings/urgent`
9. **Notifications:** WebSocket live updates if a new booking arrives while on the screen.
10. **Loading State:** Shimmer effect over the revenue chart and KPI numbers.
11. **Empty State:** "No urgent actions needed! You're all caught up."
12. **Error State:** "Could not load metrics. Tap to retry."
13. **Warning State:** "You have 3 pending jobs nearing the 2-hour response limit."
14. **Micro Animations:** Swipe-to-action on list items. Number counting animation for revenue.
15. **AI Features:** AI Demand Forecast ("High demand expected tomorrow based on weather patterns. Ensure staff are scheduled.").
16. **Design Constraints:** KPI cards must maintain a 16:9 aspect ratio and fit two per row on mobile.
17. **Page Relationships:** Affects -> Bookings Queue, Staff Assignment.
18. **Future Features:** Live weather integration widget affecting service times.

---

### Screen: Bookings Management (`(company)/(tabs)/bookings.tsx`)

**PAGE SPECIFICATION**
1. **Purpose:** Comprehensive management of all bookings across all statuses.
2. **Layout:** Horizontal Scrollable Tab UI (Pending, Upcoming, In Progress, Completed, Cancelled). List view below.
3. **Components:** Filter Tab Bar, Booking Card (shows Customer, Service, Time, Price, Assigned Staff).
4. **Buttons:** "Assign Staff", "View Details", "Message Customer".
5. **User Interaction Flow:**
   * Admin taps "Assign Staff" -> Bottom sheet opens listing active staff -> Admin selects staff -> Staff receives push notification -> Customer notified -> Modal closes.
6. **Business Logic:**
   * "In Progress" jobs cannot be cancelled by the company without Admin intervention.
7. **Permissions:** Company Admin, Company Manager.
8. **API Integration:** `GET /api/bookings?status=X`, `PATCH /api/bookings/:id/assign`
9. **Notifications:** "Booking Cancelled by Customer" alert if state changes remotely.
10. **Loading State:** Skeleton cards matching the height of real booking cards.
11. **Empty State:** "No bookings found in this category." (e.g., No cancelled jobs).
12. **Error State:** Toast: "Failed to assign staff. Please try again."
13. **Warning State:** "This job starts in 30 minutes and has no assigned staff!" (Highlighted in Amber).
14. **Micro Animations:** Smooth tab sliding indicator under the active category.
15. **AI Features:** Smart Assign: "AI recommends John Doe for this job (Closest proximity, highest rating for plumbing)."
16. **Design Constraints:** List must support infinite scrolling (pagination) for 'Completed' tab to prevent memory leaks.
17. **Page Relationships:** Affects -> Staff Schedules, Customer Tracking.
18. **Future Features:** Drag-and-drop calendar view for scheduling.

---

### Screen: Staff Management (`(company)/(tabs)/staff.tsx`)

**PAGE SPECIFICATION**
1. **Purpose:** Manage workforce, view live locations, and review performance.
2. **Layout:** Split map/list view (Uber Fleet style). Map on top showing active staff pins, List on bottom.
3. **Components:** Live MapView, Staff Avatar Cards, Status Toggles.
4. **Buttons:** "Invite Staff" (FAB), "View Schedule", "Remove Staff" (Danger).
5. **User Interaction Flow:**
   * Admin taps "Invite Staff" -> Modal opens -> Enters Phone Number -> SMS sent with deep link -> Skeleton profile created pending staff acceptance.
6. **Business Logic:**
   * Admin cannot remove a staff member if they currently have "In Progress" jobs.
7. **Permissions:** Company Admin only.
8. **API Integration:** `GET /api/companies/staff`, `POST /api/companies/staff/invite`
9. **Notifications:** N/A.
10. **Loading State:** Map placeholder image, spinning loader for list.
11. **Empty State:** "Your team is empty. Invite your first employee!"
12. **Error State:** "Failed to load live locations."
13. **Warning State:** "John Doe has disabled GPS tracking."
14. **Micro Animations:** Pulses around map pins indicating live location updates.
15. **AI Features:** Route optimization suggestions for staff with multiple jobs.
16. **Design Constraints:** FAB must sit above the Floating Tab Bar (bottom: 100).
17. **Page Relationships:** Affects -> Booking Assignment, Payout splits.
18. **Future Features:** Direct push-to-talk walkie-talkie feature with staff.

---

### Screen: Wallet & Payouts (`(company)/payouts.tsx`)

**PAGE SPECIFICATION**
1. **Purpose:** Track revenue, view escrowed funds, and execute withdrawals.
2. **Layout:** Stack navigation. Large Wallet Balance Hero Card at top. Transaction History List below.
3. **Components:** Withdraw Button, Escrow Breakdown Card, Transaction List Items (Credits/Debits).
4. **Buttons:** "Withdraw Funds" (Primary), "Manage Bank Account" (Secondary).
5. **User Interaction Flow:**
   * Admin taps "Withdraw" -> Selects Bank Account -> Confirms -> Backend hits Stripe API -> Success Toast -> Balance instantly drops to $0 -> Transaction appears in list.
6. **Business Logic:**
   * Minimum withdrawal amount: $50.00.
   * If Stripe connected account is `restricted` (needs KYC), the Withdraw button is disabled.
7. **Permissions:** Company Admin only.
8. **API Integration:** `GET /api/companies/wallet`, `POST /api/payouts/withdraw`
9. **Notifications:** Email sent confirming payout initiation.
10. **Loading State:** Shimmering balance number.
11. **Empty State:** "No transactions yet."
12. **Error State:** "Stripe Error: Bank account verification required."
13. **Warning State:** "Payouts are paused. Please upload your tax documents." (Amber banner).
14. **Micro Animations:** Wallet balance counts down visually when a withdrawal is executed.
15. **AI Features:** N/A.
16. **Design Constraints:** Debits (withdrawals/fees) shown in Red, Credits (revenue) shown in Green.
17. **Page Relationships:** Affects -> Stripe Connect, Admin Platform Commission Analytics.
18. **Future Features:** Instant payouts to debit cards via Stripe Instant Payouts.
