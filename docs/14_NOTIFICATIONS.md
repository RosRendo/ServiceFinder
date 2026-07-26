# 14: Notification Document
**Project:** Service Finder App

This maps out the exact triggers for Push Notifications (FCM), Emails, and SMS.

---

## 1. Customer Notifications
- **Booking Confirmed:**
  - Push: "Your booking for [Service] has been accepted!"
  - Email: Receipt and Booking Itinerary.
- **Staff En Route:**
  - Push: "[Staff Name] is on the way! Track their location."
- **Staff Arrived:**
  - Push: "[Staff Name] has arrived at your location." (Accompanied by device vibration / Micro-UX).
- **Job Completed:**
  - Push: "Your job is complete. Tap here to leave a review."
  - Email: Final Invoice.

## 2. Company Notifications
- **New Booking Request:**
  - Push: "New Booking Request: [Service] on [Date]. Tap to Accept."
- **Customer Cancelled:**
  - Push: "Booking #[ID] was cancelled by the customer."
- **Payout Successful:**
  - Email: "Your payout of $XXX has been deposited to your bank."

## 3. Staff Notifications
- **New Job Assigned:**
  - Push: "You have been assigned a new job for [Date]."
- **Schedule Reminder:**
  - Push (Sent 1 hour before start): "Upcoming Job: [Service] in 1 hour."

## 4. Admin Notifications
- **High-Risk Dispute:**
  - Email (Internal): "High Priority: Dispute opened for $XXX."
- **New Company Verification:**
  - Email (Internal Daily Digest): "X new companies are awaiting verification."
