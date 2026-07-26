# 11: Business Logic Document
**Project:** Service Finder App

This document outlines the hardcoded business rules, penalties, and algorithms that dictate platform behavior.

---

## 1. Financial Logic

### Commission Structure
- The platform takes a standard **15% commission** on all completed bookings.
- The commission is deducted *before* funds are added to the Company's available payout balance.
- Payouts (Stripe Connect) are executed on a T+2 rolling basis (funds available 2 days after job completion to allow for dispute windows).

### Cancellation & Refund Policies
- **Customer Cancellation:**
  - > 24 hours before job: 100% Refund (No Penalty).
  - < 24 hours before job: 50% Refund (50% paid to Company as a late cancellation penalty).
  - Staff arrives but Customer is a No-Show: 0% Refund (100% paid to Company).
- **Company/Staff Cancellation:**
  - Company cancels at any time: 100% Refund to Customer.
  - Repeated company cancellations drop their platform visibility score algorithmically.
- **Staff No-Show:**
  - If Staff does not mark "Arrived" within 30 minutes of scheduled time, the Customer can cancel for a 100% Refund.

## 2. Operational Logic

### Rescheduling Rules
- Customers can freely reschedule a booking if the original time is > 24 hours away.
- Rescheduling < 24 hours requires explicit manual approval from the Company.

### GPS & Proximity Rules
- A Staff member *cannot* tap "Arrived" unless their device GPS coordinates are within 100 meters of the Booking's `address_lat`/`lng`. 
- This prevents fraudulent job progression.

### Auto-Completion
- If a Staff member marks a job as "Completed", the Customer has 24 hours to file a dispute.
- If no dispute is filed within 24 hours, the system cron job auto-finalizes the booking and releases the funds to the Company.

### Review System
- Reviews are Double-Blind (Optional). Currently, only Customers review Companies/Staff.
- A Company's `rating_avg` is a weighted calculation of the last 100 reviews, not an all-time average, ensuring recent quality drops are reflected quickly.
