# 04: User Flows Document
**Project:** Service Finder App

This document maps the exact life cycle and flow of each user role within the platform.

---

## 1. CUSTOMER FLOW

**Registration & Discovery**
- Register (Email/Phone OTP) ↓
- Complete Profile (Name, Avatar) ↓
- Home (Browse Categories) ↓
- Search (Keyword or Map View) ↓
- Company Profile (View Services & Reviews)

**Booking Lifecycle**
- Select Service ↓
- Select Date & Time ↓
- Select Address ↓
- Payment (Stripe Hold/Pre-auth) ↓
- Status: `Waiting Approval` ↓
- Status: `Company Accepted` ↓
- Status: `Staff Assigned`

**Service Execution & Post-Service**
- Status: `Staff En Route` (Live GPS Tracking available) ↓
- Status: `Staff Arrived` (Push Notification sent) ↓
- Status: `Job Started` ↓
- Status: `Job Completed` ↓
- Customer Review Prompt ↓
- Final Payment Capture ↓
- Reward Points Granted

---

## 2. COMPANY FLOW

**Onboarding & Setup**
- Register ↓
- Upload Business Documents (PDFs/Images) ↓
- Status: `Pending Verification` ↓
- Admin Approval ↓
- Add Services (Pricing, Duration) ↓
- Add Coverage Areas ↓
- Invite Staff (Email/SMS Link)

**Job Fulfillment**
- Receive Booking Request (Push Notification) ↓
- Accept Booking ↓
- Assign Staff Member (Check Schedule) ↓
- Monitor Staff Progress (En Route -> Completed) ↓
- Job Completed ↓
- Payment Released to Company Wallet (minus platform commission)

**Financials**
- View Analytics Dashboard ↓
- Request Payout to Bank Account ↓
- Admin Approval ↓
- Funds Transferred

---

## 3. STAFF FLOW

**Daily Operations**
- Accept Job Invite (from Company) ↓
- Open Schedule/Dashboard (View Today's Route) ↓
- Tap "Start Journey" on next job ↓
- Navigation (Google Maps Integration) ↓
- Arrive at Location

**Execution**
- Complete Safety/Preparation Checklist ↓
- Tap "Start Work" ↓
- Perform Service ↓
- Tap "Complete Work" ↓
- Upload Required Proof Images (Before/After) ↓
- Customer signs off (Optional) ↓
- Receive Earning Split into Staff Wallet

---

## 4. ADMIN FLOW

**Moderation & Safety**
- Receive new Company Verification Request ↓
- Review Documents (PDF Viewer) ↓
- Approve/Reject Company ↓
- Monitor Fraud Detection Flags (High chargebacks, Fake reviews)

**Dispute Management**
- Receive Dispute Ticket (Customer vs Company) ↓
- Review Chat Logs & Images ↓
- Execute Refund to Customer OR Release Funds to Company

**Platform Maintenance**
- Adjust Global Commission Rates ↓
- Generate Monthly Financial Reports ↓
- Manage Global Service Categories (Add/Remove options)
