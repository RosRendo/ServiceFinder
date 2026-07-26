# 18. Staff Role Bible
**Module:** `(staff)`
**Status:** 10/10 Enterprise Grade

This document serves as the absolute source of truth for the Staff Module (the app interface for the workers/technicians executing the jobs). It defines the business logic for shift management, job execution, and earnings tracking, adhering strictly to the 18-Point Page Specification format.

---

## PART 1: Core System Flows

### 1. Shift & Status Flow
**Trigger:** Staff member opens the app.
1. **Clock In:** Staff toggles their status to "Online" (Active).
2. **GPS Tracking:** The app immediately begins transmitting WebSocket location pings to the Company and Customer.
3. **Availability:** Staff becomes eligible for Auto-Assignment from the Company.
4. **Clock Out:** Toggling offline pauses location sharing and prevents new job assignments.

### 2. Job Execution Flow
**Trigger:** Staff arrives at the customer's location.
1. **En Route:** Staff taps "Start Navigation". Customer gets an SMS ("Your pro is on the way").
2. **Arrival:** Staff taps "Arrived". The system enforces a geofence check to ensure they are within 100 meters of the customer's coordinates.
3. **In Progress:** Staff taps "Start Job". A timer begins.
4. **Completion:** Staff must upload 2 mandatory photos (Before/After) and tap "Complete Job".
5. **Sign-off:** Customer signs on the Staff's screen (optional). The escrowed funds are released to the Company.

### 3. Earnings Tracking Flow
**Trigger:** Job is marked completed.
1. **Commission Cut:** If the company pays on a commission basis (e.g., 40% of job price), the staff's personal `walletBalance` increments immediately.
2. **Tips:** Customer tips are routed 100% directly to the Staff member's wallet, bypassing the company.
3. **Payouts:** Staff can view their weekly earnings and withdraw tips to their personal bank account via Stripe Connect.

---

## PART 2: Screen Specifications (18-Point Format)

### Screen: Staff Dashboard (My Jobs) (`(staff)/(tabs)/dashboard.tsx`)

**PAGE SPECIFICATION**
1. **Purpose:** The primary workspace for the staff member to see their current task and daily itinerary.
2. **Layout:** Large Hero Map at the top with turn-by-turn directions. Swipeable "Current Job" card floating above the map. Scrollable "Next Up" list below.
3. **Components:** Status Toggle Switch (Online/Offline), Current Job Card, Map, Route Polyline.
4. **Buttons:** "Navigate" (Primary), "Start Job" (Green), "Call Customer" (Ghost).
5. **User Interaction Flow:**
   * Staff receives push notification for new job -> Taps notification -> Opens Dashboard -> Job card slides up -> Taps "Navigate" -> Opens Apple/Google Maps.
6. **Business Logic:**
   * "Start Job" button is disabled until the phone's GPS is within 100m of the destination geofence.
7. **Permissions:** Staff only.
8. **API Integration:** `GET /api/staff/my-jobs`, `PATCH /api/bookings/:id/status`
9. **Notifications:** "New Job Assigned", "Customer cancelled the job".
10. **Loading State:** Shimmering map placeholder and skeleton cards.
11. **Empty State:** "You have no assigned jobs today. Enjoy your break!"
12. **Error State:** "GPS Signal lost. Please check your location settings."
13. **Warning State:** "You are running 15 minutes late for your next job." (Amber Banner).
14. **Micro Animations:** Slide-to-complete slider for finishing jobs (prevents accidental taps).
15. **AI Features:** AI time estimation (predicting job duration based on previous similar jobs by this staff member).
16. **Design Constraints:** Map must support Dark Mode automatically. Buttons must be large enough to tap while wearing gloves.
17. **Page Relationships:** Affects -> Company Fleet Map, Customer Tracking Screen.
18. **Future Features:** Live weather radar overlaid on the route map.

---

### Screen: Job Completion (Proof of Work) (`(staff)/job/[id]/complete.tsx`)

**PAGE SPECIFICATION**
1. **Purpose:** Ensure quality control and dispute prevention by forcing photo documentation before closing a job.
2. **Layout:** Vertical Stack. Camera Viewfinder component, followed by an Add Notes text area, followed by a Customer Signature pad.
3. **Components:** ImagePicker, Canvas Signature Pad, Tip Suggestion UI.
4. **Buttons:** "Capture Photo", "Submit Completion" (Primary).
5. **User Interaction Flow:**
   * Staff taps "Complete Job" -> Opens screen -> Takes 'After' photo -> Hands phone to customer for signature -> Taps Submit -> Confetti animation -> Returns to Dashboard.
6. **Business Logic:**
   * Job cannot change to `completed` unless at least 1 photo is uploaded to AWS S3.
7. **Permissions:** Staff only.
8. **API Integration:** `POST /api/upload`, `POST /api/bookings/:id/complete`
9. **Notifications:** Triggers receipt email to customer.
10. **Loading State:** Spinning loader over the submit button while images upload.
11. **Empty State:** N/A.
12. **Error State:** "Failed to upload photo. Please ensure you have a network connection."
13. **Warning State:** "Customer signature is missing."
14. **Micro Animations:** Confetti pop on successful submission.
15. **AI Features:** AI image validation (verifying the photo is actually of the repaired item, not a blurry picture of the floor).
16. **Design Constraints:** Camera viewfinder must use 4:3 aspect ratio.
17. **Page Relationships:** Affects -> Company Escrow Release, Customer Review Prompt.
18. **Future Features:** Video upload support for complex jobs.

---

### Screen: Staff Earnings (`(staff)/(tabs)/earnings.tsx`)

**PAGE SPECIFICATION**
1. **Purpose:** Provide transparency and motivation regarding the staff member's take-home pay.
2. **Layout:** Split view. Top: Large Daily/Weekly Earnings graph. Bottom: Breakdown of Jobs vs. Tips.
3. **Components:** Bar Chart (Earnings over time), Stat Cards (Avg Tip, Jobs Done), Transaction List.
4. **Buttons:** "Withdraw Tips" (Primary), "Change Date Range".
5. **User Interaction Flow:**
   * Staff taps graph bar -> Updates list below to show transactions for that specific day.
6. **Business Logic:**
   * Base pay is calculated dynamically based on the Company's commission rate setup. Tips are 100% Staff take-home.
7. **Permissions:** Staff only.
8. **API Integration:** `GET /api/staff/earnings`
9. **Notifications:** "You just received a $20 tip from John Doe!"
10. **Loading State:** Shimmering chart.
11. **Empty State:** "No earnings for this period."
12. **Error State:** "Could not load earnings."
13. **Warning State:** N/A.
14. **Micro Animations:** Bars in the chart grow upwards from zero on load. Number counts up for total earnings.
15. **AI Features:** "You earn 15% more in tips when you arrive 5 minutes early." (AI Insights).
16. **Design Constraints:** Tip amounts shown in Gold/Yellow to differentiate from base pay (Green).
17. **Page Relationships:** Affects -> Stripe Connect.
18. **Future Features:** Gamification (Leaderboards for top earners in the company).
