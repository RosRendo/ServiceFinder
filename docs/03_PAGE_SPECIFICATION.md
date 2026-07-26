# 03: Page Specification Document
**Project:** Service Finder App

This document outlines the strict behavioral requirements for key pages across the platform.

---

## 1. Customer: Booking Details (`booking/[id].tsx`)

**PURPOSE**
Track booking progress, communicate with staff, and manage booking lifecycle.

**LAYOUT**
- Stack navigation (requires Back button)
- Floating action buttons at bottom

**PERMISSION**
- Customer: YES (if owner)
- Company: YES (if assigned)
- Staff: YES (if assigned)
- Admin: READ ONLY

**BUTTONS & ACTIONS**
1. **Cancel Booking**
   - ↓ Confirmation Modal
   - ↓ Checks Refund Policy (e.g., 100% if >24hr, 50% if <24hr)
   - ↓ Triggers Stripe Refund
   - ↓ Notification to Company & Staff
2. **Reschedule**
   - ↓ Checks 24-hour policy (Cannot reschedule <24hr without penalty)
   - ↓ Opens DateTime Picker Modal
   - ↓ Sends request to Company for approval
3. **Track Staff**
   - ↓ Opens `track-staff.tsx` Map
   - ↓ Action visible *only* if Status == "En Route"
4. **Contact Company/Staff**
   - ↓ Opens Chat Room modal

**STATES**
- **Loading:** Skeleton loaders for map and timeline.
- **Empty State:** N/A (Booking must exist to view).
- **Error State:** "Failed to load booking details" with a Retry button.

**BUSINESS LOGIC**
- If staff doesn't show up within 30 minutes of scheduled time, Customer can cancel without penalty.
- Auto-completes 24 hours after Staff marks "Completed" if no customer dispute is filed.

---

## 2. Company: Dashboard (`(tabs)/dashboard.tsx`)

**PURPOSE**
High-level overview of business performance and immediate queue management.

**PERMISSION**
- Customer: NO
- Company: YES
- Staff: NO
- Admin: NO

**BUTTONS & ACTIONS**
1. **Accept Booking** (on pending list)
   - ↓ Assigns booking to company pool
   - ↓ Notifies Customer
2. **Decline Booking**
   - ↓ Prompts for reason (Too busy, Out of area)
   - ↓ Refunds Customer automatically
3. **View All Pending**
   - ↓ Navigates to `bookings.tsx` with 'Pending' filter applied

**STATES**
- **Empty State:** "You have no active bookings today! Try expanding your coverage area."
- **Loading:** ActivityIndicator in the center of cards.

**NOTIFICATIONS**
- Badge icon on bell if new bookings arrive while on page.

---

## 3. Staff: Job Execution (`job/[id]/update-status.tsx`)

**PURPOSE**
Allow staff to progress the job state and upload evidence.

**PERMISSION**
- Customer: NO
- Company: READ ONLY (via dashboard)
- Staff: YES (if assigned)
- Admin: READ ONLY

**BUTTONS & ACTIONS**
1. **Start Journey**
   - ↓ Prompts location permission
   - ↓ Changes status to "En Route"
   - ↓ Notifies Customer via Push
2. **Arrived**
   - ↓ Verifies GPS boundary (<100m from destination)
   - ↓ Changes status to "Arrived"
3. **Upload Proof Image**
   - ↓ Opens Device Camera / Gallery
   - ↓ Uploads to S3/Firebase Storage
4. **Complete Job**
   - ↓ Requires at least 1 image uploaded
   - ↓ Triggers Customer Review prompt
   - ↓ Triggers Payment release countdown

**ANIMATIONS & MICRO-UX**
- Swipe-to-confirm slider for "Complete Job" to prevent accidental clicks.
- Haptic feedback when status changes.

---

## 4. Admin: Dispute Resolution (`disputes/[id].tsx`)

**PURPOSE**
Mediate conflicts between customers and companies regarding payment or service quality.

**PERMISSION**
- Admin: YES (Super Admin & Moderator)
- Others: NO

**BUTTONS & ACTIONS**
1. **Refund Customer (Full/Partial)**
   - ↓ Opens Input Modal for amount
   - ↓ Deducts from Company Wallet
   - ↓ Processes Stripe Refund
2. **Dismiss Claim (Rule in favor of Company)**
   - ↓ Releases frozen funds to Company
   - ↓ Closes dispute
3. **Suspend Company**
   - ↓ Opens confirmation modal
   - ↓ Freezes company account immediately

**SECURITY**
- Requires Admin PIN or re-authentication to execute financial transfers (Refunds).
- All actions logged in `AuditTable` with IP and Timestamp.
