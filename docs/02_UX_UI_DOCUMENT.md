# UX/UI & Enterprise Screen Specification Document
**Project:** Service Finder App

This document outlines the User Experience (UX), User Interface (UI), and deep behavioral rules for every screen. It strictly follows the mandatory 18-Point Enterprise Page Specification format.

---

## 1. Global UX/UI Rules & Micro-UX Specifications
* **Backgrounds:** Slate 50 (`#F8FAFC`) for app backgrounds, Pure White (`#FFFFFF`) for cards.
* **Primary Color:** Deep Navy (`#0A192F`) for headers and primary CTAs.
* **Accent Colors:** 
  * Blue 600 (`#2563EB`) - Selection, Icons, Links.
  * Emerald Green (`#10B981`) - Success, Verified.
  * Amber (`#F59E0B`) - Warnings, Pending.
  * Red (`#EF4444`) - Danger, Errors, Deletion.
* **Micro-UX Guidelines:**
  * **Images:** Hover/Tap -> Slight Zoom (`scale: 1.05`), Tap -> Fullscreen gallery.
  * **Buttons:** Tap -> Shrink animation (`scale: 0.95`), 200ms transition.
  * **Favorites:** Tap -> Heart pump animation, triggers success Toast.
  * **Ratings:** Tap -> Accordion expand to show review breakdown.
  * **Action Modals:** Call/Message -> Triggers Bottom Sheet or Confirmation Modal.
* **Design Constraints:** 
  * **Animation Duration:** 200ms standard.
  * **Accessibility:** Required for all touch targets (min 44x44).
  * **Responsiveness:** Must support Mobile, Tablet, and Desktop (Web) views.

---

## 2. Page Specifications

### Module: Customer - Booking Details (`booking/[id].tsx`)

**PAGE SPECIFICATION**
1. **Purpose:** Track booking progress, manage lifecycle, and communicate with staff.
2. **Layout:** Stack navigation (Back button required), Timeline hero, Bottom floating actions.
3. **Components:** Status Timeline Tracker, Google MapView, Receipt Card, Provider Profile Card.
4. **Buttons:** "Cancel Booking" (Danger), "Reschedule", "Track Staff", "Message Staff".
5. **User Interaction Flow:**
   * Customer presses "Cancel Booking" -> Confirmation modal opens -> Shows cancellation policy & refund amount -> User confirms -> Notification sent -> Booking updated -> Refund processing -> Success animation -> Returns to Booking List.
6. **Business Logic:**
   * Cancel <24 hours before: 50% Refund.
   * Cancel >24 hours before: 100% Refund.
   * If Staff is assigned: Cancellation requires Admin review.
   * If Booking is Completed: Cannot cancel.
7. **Permissions:** Customer (Owner), Staff (Assigned), Company (Assigned). Admin (Read Only).
8. **API Integration:** `GET /api/bookings/:id`, `PATCH /api/bookings/:id/cancel`
9. **Notifications:** "Booking Cancelled" -> Notifies Company & Staff -> Sends Refund Email to Customer.
10. **Loading State:** Skeleton timeline and map placeholder.
11. **Empty State:** N/A (Screen requires a valid ID).
12. **Error State:** "Booking not found" (Return to home), "Failed to cancel" (Retry toast).
13. **Warning State:** "You are cancelling less than 24 hours before the job. A 50% fee applies."
14. **Micro Animations:** Status badge cross-fade on update, CTA button press shrink.
15. **AI Features:** AI Chatbot suggestion for reschedule times based on Company availability.
16. **Design Constraints:** Map height min 250px. Max 2 primary CTAs visible at once.
17. **Page Relationships:** Affects -> Checkout, Payment, Analytics, Notification System.
18. **Future Features:** Live video call with Staff via WebRTC.

---

### Module: Company - Dashboard (`(company)/(tabs)/dashboard.tsx`)

**PAGE SPECIFICATION**
1. **Purpose:** High-level overview of business performance and immediate queue management.
2. **Layout:** Grid layout for top metric cards. Vertical list for Pending Requests Queue.
3. **Components:** Hero Card (Revenue), KPI Cards (Grid), Pending Request List Items.
4. **Buttons:** "Accept" (Green), "Decline" (Red), "View All Pending".
5. **User Interaction Flow:**
   * Admin taps "Decline" -> Bottom sheet opens -> Admin selects reason -> Submits -> Customer refunded -> Card slides out (Dismiss animation) -> Queue updates.
6. **Business Logic:**
   * Must hold stripe hold while pending.
   * Declining a job auto-triggers the release of the customer's funds.
7. **Permissions:** Company Admin only.
8. **API Integration:** `GET /api/companies/metrics`, `GET /api/bookings?status=pending`
9. **Notifications:** In-app toast + Bell badge when a new booking arrives.
10. **Loading State:** ActivityIndicator centered in cards, Shimmer effect on Revenue.
11. **Empty State:** "You have no active bookings today! Try expanding your coverage area."
12. **Error State:** Metrics show "-" if failed to fetch. Toast for failed accept/decline.
13. **Warning State:** "You have 5 pending requests older than 2 hours. Response rate dropping."
14. **Micro Animations:** Accept/Decline list item swipe-to-delete animation.
15. **AI Features:** Predictive demand chart ("Expect higher bookings this weekend").
16. **Design Constraints:** KPI cards must be exactly 48% width to support 2-column mobile layout.
17. **Page Relationships:** Affects -> Customer Booking Status, Staff Assignment Pool, Global Analytics.
18. **Future Features:** Real-time WebSocket live-updating revenue ticker.

---

### Module: Staff - Job Status (`job/[id]/update-status.tsx`)

**PAGE SPECIFICATION**
1. **Purpose:** Allow staff to progress the job state, track location, and upload evidence.
2. **Layout:** Stack screen with prominent current status banner. Action Checklist below.
3. **Components:** Status Stepper, Image Upload Grid, Large Swipe-to-Confirm Button.
4. **Buttons:** "Start Journey", "Arrived", "Upload Proof", "Complete Job".
5. **User Interaction Flow:**
   * Staff arrives -> Swipes "Arrived" -> App checks GPS -> If <100m, status updates -> Customer notified -> Staff prompted to upload "Before" picture.
6. **Business Logic:**
   * "Complete Job" button disabled until at least 1 proof image is uploaded.
   * Geofencing strictly requires GPS <100m to mark "Arrived".
7. **Permissions:** Staff (Assigned only).
8. **API Integration:** `PATCH /api/bookings/:id/status`, `POST /api/upload`, `POST /api/location`
9. **Notifications:** Triggers Push Notification to Customer: "Staff has arrived".
10. **Loading State:** Button shows inline spinner during status patch.
11. **Empty State:** N/A.
12. **Error State:** "Image upload failed. Check connection."
13. **Warning State:** "GPS verification failed. You are 2.5km from the destination."
14. **Micro Animations:** Haptic feedback on swipe success. Confetti pop on "Complete Job".
15. **AI Features:** AI image validation (verifies the proof image matches the service category).
16. **Design Constraints:** Swipe-to-confirm button must stretch 100% width.
17. **Page Relationships:** Affects -> Customer Live Map, Company Dashboard, Payroll/Wallet.
18. **Future Features:** Automatic background GPS tracking interval adjustments.

---

### Module: Admin - Dispute Resolution (`disputes/[id].tsx`)

**PAGE SPECIFICATION**
1. **Purpose:** Mediate conflicts between customers and companies regarding payment or service quality.
2. **Layout:** Split view desktop / Tab view mobile. Customer claim vs. Company response.
3. **Components:** Evidence Image Viewer, Text Blocks, Admin Action Bar (Fixed Bottom).
4. **Buttons:** "Refund Customer" (Danger), "Dismiss Claim", "Suspend Company".
5. **User Interaction Flow:**
   * Admin taps "Refund Customer" -> Prompts for PIN -> Admin enters PIN -> Stripe API triggers refund -> Both parties emailed -> Dispute closed.
6. **Business Logic:**
   * Refunds over $500 require secondary Super Admin approval.
   * Dismissing a claim immediately releases frozen funds to the Company wallet.
7. **Permissions:** Super Admin.
8. **API Integration:** `GET /api/disputes/:id`, `POST /api/disputes/:id/resolve`
9. **Notifications:** Email sent to Customer and Company with the resolution verdict.
10. **Loading State:** Skeleton placeholders for evidence images.
11. **Empty State:** N/A.
12. **Error State:** "Failed to process refund. Stripe API error."
13. **Warning State:** "Company has 3 other open disputes. High risk."
14. **Micro Animations:** Tapping images opens full-screen lightbox with smooth shared-element transition.
15. **AI Features:** AI summarizes the dispute text and suggests a resolution based on past rulings.
16. **Design Constraints:** Customer view tinted Red (Error/Loss), Company view tinted Blue.
17. **Page Relationships:** Affects -> User Accounts, Company Payouts, Stripe Balance.
18. **Future Features:** Automated AI arbitration for disputes under $50.

---
*Note: This 18-Point Enterprise Specification format is strictly enforced for all future UI redesigns and architectural planning.*
