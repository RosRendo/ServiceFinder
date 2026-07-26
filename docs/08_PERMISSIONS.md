# 08: Permission Document
**Project:** Service Finder App

This document strictly defines the Access Control List (ACL) and capabilities for the four user roles.

---

## 1. CUSTOMER

**CAN (Allowed Actions)**
- Browse companies, services, and categories.
- Create bookings and process payments.
- Cancel a booking (subject to penalty rules).
- Reschedule a booking (subject to 24-hr rules).
- Message assigned Staff and Company Admin.
- Leave reviews and ratings for completed jobs.
- Delete own account.

**CANNOT (Restricted Actions)**
- Approve refunds.
- View company analytics or other customers' data.
- Assign staff to jobs.
- Bypass the payment hold.

---

## 2. COMPANY (Service Provider Admin)

**CAN (Allowed Actions)**
- Manage (Create, Update, Delete) their own Service Catalog.
- Invite, Suspend, and Remove their own Staff members.
- Accept or Decline incoming booking requests.
- Assign/Re-assign specific staff to a booking.
- Dispute a customer refund request.
- View company-wide analytics and revenue.
- Request payouts to their registered bank account.

**CANNOT (Restricted Actions)**
- Suspend Customer accounts.
- Alter the platform commission percentage.
- Approve their own verification status.
- View data or analytics of competitor companies.
- Directly refund a customer without Admin mediation (if disputed).

---

## 3. STAFF (Employee/Provider)

**CAN (Allowed Actions)**
- View jobs assigned specifically to them.
- Update job status (En Route, Arrived, In Progress, Completed).
- Upload images to a specific job record.
- Message the specific customer they are assigned to.
- Request Time Off from their Company Admin.
- View their own personal earnings and reviews.

**CANNOT (Restricted Actions)**
- Accept new bookings on behalf of the company.
- See total company revenue.
- Assign jobs to other staff members.
- Change the price of a service.
- Refund a customer.

---

## 4. ADMIN (Platform Operator)

**CAN (Allowed Actions)**
- EVERYTHING.
- Approve, Suspend, or Ban ANY User, Company, or Staff account.
- Modify platform commission rates globally or per-company.
- Execute forced refunds (Full or Partial).
- View all chats between all users (for safety/dispute reasons).
- Manage global categories and taxonomy.
- Access Audit Logs and System Health metrics.

**CANNOT (Restricted Actions)**
- Admins cannot edit a Customer's private payment details (credit card numbers are vaulted by Stripe).
- Admins cannot permanently delete Audit Logs (Immutable compliance requirement).
