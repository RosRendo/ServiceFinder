# Product Requirements Document (PRD)
**Project:** Service Finder App
**Platform:** React Native (Expo) + NestJS Backend

## 1. Executive Summary
The Service Finder App is a comprehensive platform connecting customers with service companies and their staff. The platform facilitates discovering services, booking appointments, managing staff schedules, and processing payments, all overseen by a master administration panel.

## 2. Target Audience & User Roles
The platform serves four distinct user roles:

1. **Customers:** End-users looking to book services (e.g., cleaning, plumbing, beauty).
2. **Companies:** Service providers who manage a catalog of services, assign staff, and receive payouts.
3. **Staff (Providers):** Employees of companies who execute the actual jobs, track their schedules, and navigate to customer locations.
4. **Admins:** Platform operators who moderate users, handle disputes, manage categories, and oversee system health.

## 3. Core Features by Role

### 3.1 Public & Authentication `(public)`
* **Onboarding & Welcome:** Landing screens explaining the value proposition.
* **Authentication:** Login (Email/Phone OTP), Registration, Social Auth (Google/Facebook).
* **Account Recovery:** Forgot password, reset password, and email verification flows.

### 3.2 Customer App `(customer)`
* **Discovery (Home & Explore):** Browse popular services, featured companies, and categories.
* **Search & Map View:** Search for services by keyword with an interactive map view (`map-view.tsx`).
* **Company & Service Details:** View company profiles, reviews, and select specific services.
* **Booking Flow:** 
  * Select service, date, and time.
  * Enter address (`address/index.tsx`, `address/[id].tsx`).
  * Checkout and payment processing.
* **Booking Management:** Track active bookings, view history, cancel, reschedule, and track staff live location (`booking/track-staff.tsx`).
* **Communication:** Real-time messaging with companies/staff (`messages/index.tsx`).
* **Profile & Settings:** Manage saved items, reviews, profile details, and change passwords.

### 3.3 Company Portal `(company)`
* **Dashboard:** High-level metrics on bookings, revenue, and active staff.
* **Booking Management:** Accept, decline, or reassign incoming bookings (`(tabs)/bookings.tsx`).
* **Service Catalog:** Create and edit services offered (`services/new.tsx`).
* **Staff Management:** Invite staff, assign coverage areas, and view staff performance (`staff/new.tsx`, `staff/[id].tsx`).
* **Financials & Payouts:** View analytics, request payouts to bank accounts (`payouts/request.tsx`, `payouts/bank-account.tsx`).
* **Settings:** Manage company profile, subscription tier, and service coverage zones (`coverage.tsx`).

### 3.4 Staff App `(staff)`
* **Dashboard & Schedule:** View today's agenda, upcoming shifts, and available jobs.
* **Job Execution:** 
  * View job details and customer requirements (`job/[id]/index.tsx`).
  * Update job status (En Route, In Progress, Completed) (`job/[id]/update-status.tsx`).
  * Track route to customer via map (`job/[id]/track-map.tsx`).
* **AI & Measurements:** Utilize AI tools for job estimation or measurements (`ai/ai.tsx`, `measurement/index.tsx`).
* **Wallet & Performance:** Track earnings, view performance reviews from customers, and manage time-off requests.

### 3.5 Admin Panel `(admin)`
* **Dashboard:** Platform health, total revenue, user growth, and pending verification queues.
* **User & Company Moderation:** View, suspend, or delete user and company accounts (`users/[id].tsx`, `company/[id].tsx`).
* **Dispute Resolution:** Mediate conflicts between customers and companies (`disputes/[id].tsx`).
* **Platform Configuration:** Manage global service categories and sub-categories (`categories/index.tsx`).
* **Financial Oversight:** Approve company payouts and view system-wide analytics.
* **System Audit & Monitoring:** View audit logs and compliance metrics.

## 4. Technical Requirements
* **Frontend:** React Native with Expo Router for cross-platform support (iOS, Android, Web).
* **Backend:** NestJS microservices or monolithic API.
* **Database:** PostgreSQL (assumed) with Prisma or TypeORM.
* **Authentication:** Firebase Auth (OTP, Social) + JWT via backend.
* **Maps & Routing:** Google Maps SDK integration for live tracking and address autocomplete.
* **Real-time:** WebSockets (Socket.io) for live messaging and GPS tracking.

## 5. Future Considerations
* Multi-language support (i18n is currently implemented).
* Subscription tiers for companies (Free, Pro, Enterprise).
* Advanced AI scheduling algorithms for companies.
