# 🗺️ SERVICE FINDER - Complete Application Flow & Infrastructure Guide

## 📋 Table of Contents
1. [Application Overview](#application-overview)
2. [Complete User Journeys](#complete-user-journeys)
3. [Dashboard Requirements by Role](#dashboard-requirements-by-role)
4. [Backend API Routes Map](#backend-api-routes-map)
5. [Frontend Folder Structure](#frontend-folder-structure)
6. [Payment Flow](#payment-flow)
7. [Staff Assignment Flow](#staff-assignment-flow)

---

## 🌟 APPLICATION OVERVIEW

### **The Complete Service Finder Flow**

```
CUSTOMER finds service → Books company → Payment → Staff assigned → Service delivered → Review left
     ↓                        ↓              ↓            ↓                ↓              ↓
  Browse by          Select company/   Pay upfront   Company      Staff completes    Customer
  category &         service type      or later      assigns      the job            rates the
  location                                           staff                           service
```

---

## 👥 COMPLETE USER JOURNEYS

### **1️⃣ CUSTOMER JOURNEY**

#### **Flow: From Finding Service to Completion**
```
Step 1: Browse Services
  Route: /customer/services
  API: GET /api/categories → GET /api/service-types?categoryId=X
  Purpose: Show available service categories and types

Step 2: Find Companies
  Route: /customer/services/[category]/[serviceType]
  API: GET /api/companies/categories/{categorySlug}/service-types/{serviceTypeSlug}
  Purpose: List companies offering this service in their area

Step 3: View Company Details
  Route: /customer/services/[category]/[serviceType]/company/[id]
  API: GET /api/companies/:id/details
  Purpose: See company profile, ratings, services, reviews

Step 4: Book Service
  Route: /customer/services/[category]/[serviceType]/company/[id]/booking
  API: POST /api/bookings
  Data needed:
    - serviceId
    - bookingDate
    - startTime
    - endTime
    - serviceAddress
  Purpose: Create a booking request

Step 5: Make Payment
  Route: /customer/bookings/[bookingId]/payments
  API: POST /api/payments/checkout-session
       POST /api/payments/complete
  Purpose: Process payment via Stripe

Step 6: Track Booking
  Route: /customer/bookings/[bookingId]
  API: GET /api/bookings/:id
  Purpose: See booking status, assigned staff, progress

Step 7: Leave Review (After Service)
  Route: /customer/reviews/new?bookingId=X
  API: POST /api/reviews
  Data: { bookingId, rating, comment }
```

---

### **2️⃣ COMPANY ADMIN JOURNEY**

#### **Flow: Managing Business Operations**
```
Step 1: Company Dashboard
  Route: /company/dashboard
  APIs needed:
    - GET /api/companies/bookings?status=pending (Pending bookings)
    - GET /api/companies/bookings?status=confirmed (Active bookings)
    - GET /api/payments (Recent payments)
    - GET /api/reviews/company/:companyId (Recent reviews)
    - GET /api/companies/staff (Staff overview)
  Display:
    - Total revenue this month
    - Pending booking requests
    - Active jobs in progress
    - Staff availability status
    - Recent reviews/ratings

Step 2: Manage Services
  Route: /company/services
  API: GET /api/services?companyId=X
  Actions:
    → Create New: /company/services/new
       API: POST /api/services
    → Edit: /company/services/[id]
       API: GET /api/services/:id
            PUT /api/services/:id
    → Delete: DELETE /api/services/:id

Step 3: Manage Bookings
  Route: /company/bookings
  API: GET /api/companies/bookings
  
  View Detail: /company/bookings/[id]
  API: GET /api/bookings/:id
  
  Actions:
    → Assign Staff: POST /api/companies/assign-staff
       Data: { bookingId, staffId }
    → Update Status: PATCH /api/bookings/:id/status
       Data: { status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled' }

Step 4: Manage Staff
  Route: /company/staff
  API: GET /api/companies/staff
  
  Actions:
    → Add Staff: /company/staff/new
       API: POST /api/companies/staff
       Data: { userId, role: 'cleaner' | 'supervisor' }
    
    → View/Edit Staff: /company/staff/[id]
       API: GET /api/companies/staff/:id
            PUT /api/companies/staff/:id
    
    → Remove Staff: DELETE /api/companies/staff/:id
    
    → Reactivate: POST /api/companies/staff/:id/reactivate

Step 5: View Payments
  Route: /company/payments
  API: GET /api/payments (filtered for this company)
  Purpose: Track revenue, pending payouts

Step 6: Manage Reviews
  Route: /company/reviews
  API: GET /api/reviews/company/:companyId
  Purpose: Monitor customer feedback
```

---

### **3️⃣ STAFF JOURNEY**

#### **Flow: Managing Assigned Jobs**
```
Step 1: Staff Dashboard
  Route: /staff/dashboard
  APIs needed:
    - GET /api/staff/bookings?status=confirmed (Today's jobs)
    - GET /api/staff/availability/me (My availability)
    - GET /api/staff/services/pending (Service requests to review)
  Display:
    - Today's assigned jobs
    - Upcoming schedule
    - Pending service requests
    - Earnings this month

Step 2: View Schedule
  Route: /staff/schedule
  API: GET /api/staff/bookings (calendar view)
  Purpose: See all assigned jobs in calendar format

Step 3: Manage Service Requests
  Route: /staff/services
  API: GET /api/staff/services/pending
  
  Actions:
    → Approve: PATCH /api/staff/services/:id/approve
    → Reject: PATCH /api/staff/services/:id/reject
       Data: { reason: 'Not available' }

Step 4: Manage Active Jobs
  Route: /staff/bookings
  API: GET /api/staff/bookings
  
  View Detail: /staff/bookings/[id]
  API: GET /api/staff/bookings/:id
  
  Actions:
    → Start Job: POST /api/bookings/:id/start
    → Update Progress: PATCH /api/bookings/:id/progress
       Data: { progress: 50 }
    → Complete Job: POST /api/bookings/:id/complete

Step 5: Manage Availability
  Route: /staff/availability
  API: GET /api/staff/availability/me
       POST /api/staff/availability (bulk create for next 30 days)
       DELETE /api/staff/availability/:id
```

---

### **4️⃣ ADMIN JOURNEY**

#### **Flow: Platform Management**
```
Step 1: Admin Dashboard
  Route: /admin/dashboard
  APIs needed:
    - GET /api/users (total users count)
    - GET /api/companies (total companies)
    - GET /api/bookings (platform-wide stats)
    - GET /api/payments (revenue stats)
  Display:
    - Total users, companies, bookings
    - Revenue metrics
    - Recent activity
    - Pending verifications

Step 2: Manage Users
  Route: /admin/users
  API: GET /api/users
  
  Edit User: /admin/users/[id]
  API: GET /api/users/:id
       PUT /api/users/:id
       PATCH /api/users/:id/status
       DELETE /api/users/:id

Step 3: Manage Companies
  Route: /admin/companies
  API: GET /api/companies
  
  Edit Company: /admin/companies/[id]
  API: GET /api/companies/:id
       PUT /api/companies/:id
       DELETE /api/companies/:id

Step 4: Verify Companies
  Route: /admin/verification
  API: GET /api/companies?status=pending
  Purpose: Approve/reject new company registrations

Step 5: Manage Categories
  Route: /admin/categories
  API: GET /api/categories
       POST /api/categories
       PUT /api/categories/:id
       DELETE /api/categories/:id

Step 6: Manage Service Types
  Route: /admin/service-types
  API: GET /api/service-types
       POST /api/service-types
       PUT /api/service-types/:id
       DELETE /api/service-types/:id
```

---

## 📊 DASHBOARD REQUIREMENTS BY ROLE

### **Customer Dashboard** (`/customer/dashboard`)

#### APIs to Call:
```javascript
// My Active Bookings
GET /api/bookings?customerId=X&status=confirmed,in_progress

// Upcoming Bookings
GET /api/bookings?customerId=X&status=pending

// Recent Reviews
GET /api/reviews/my

// Payment History
GET /api/payments?userId=X
```

#### Data to Display:
- Active bookings count
- Next upcoming booking
- Recent service history
- Favorite companies
- Total amount spent
- Reviews given

---

### **Company Dashboard** (`/company/dashboard`)

#### APIs to Call:
```javascript
// Pending booking requests
GET /api/companies/bookings?status=pending

// Active jobs
GET /api/companies/bookings?status=confirmed,in_progress

// Revenue this month
GET /api/payments?companyId=X&startDate=YYYY-MM-01

// Staff status
GET /api/companies/staff

// Recent reviews
GET /api/reviews/company/:companyId?limit=5

// Booking statistics
GET /api/companies/bookings (with date filters)
```

#### Data to Display:
- Revenue (today, this week, this month)
- Pending booking requests (need action)
- Active jobs in progress
- Available staff vs busy staff
- Average rating
- Total bookings this month
- Chart: Bookings over time
- Chart: Revenue trend

---

### **Staff Dashboard** (`/staff/dashboard`)

#### APIs to Call:
```javascript
// Today's jobs
GET /api/staff/bookings?date=today

// Pending service requests
GET /api/staff/services/pending

// My availability
GET /api/staff/availability/me

// Completed jobs this month
GET /api/staff/bookings?status=completed&month=current
```

#### Data to Display:
- Today's schedule
- Pending service requests count
- Jobs completed this month
- Earnings this month
- Next upcoming job
- Availability status

---

### **Admin Dashboard** (`/admin/dashboard`)

#### APIs to Call:
```javascript
// Platform statistics
GET /api/users?count=true
GET /api/companies?count=true
GET /api/bookings?count=true

// Pending verifications
GET /api/companies?verificationStatus=pending

// Revenue metrics
GET /api/payments (aggregate data)

// Recent activity
GET /api/bookings?limit=10
GET /api/users?limit=10
```

#### Data to Display:
- Total users, companies, bookings
- Pending company verifications
- Platform revenue
- Active bookings
- Chart: User growth
- Chart: Revenue trend
- Recent activity feed

---

## 🔄 PAYMENT FLOW (Step-by-Step)

```
┌─────────────────────────────────────────────────────────────┐
│                    PAYMENT PROCESS                          │
└─────────────────────────────────────────────────────────────┘

Step 1: Customer Books Service
  Route: /customer/bookings/[bookingId]
  Status: Booking created with status='pending'
  
Step 2: Customer Initiates Payment
  Route: /customer/bookings/[bookingId]/payments
  Frontend calls: POST /api/payments/checkout-session
  Request: {
    bookingId: "123",
    amount: 100.00
  }
  
Step 3: Backend Creates Stripe Session
  Backend: Creates Stripe checkout session
  Response: { sessionId: "cs_xxx", url: "https://checkout.stripe.com/..." }
  
Step 4: Customer Redirected to Stripe
  Frontend: Redirect to Stripe checkout URL
  Customer enters payment details
  
Step 5: Stripe Processes Payment
  Stripe redirects back to: /customer/bookings/[bookingId]/payments/success?session_id=cs_xxx
  
Step 6: Frontend Confirms Payment
  Route: /customer/bookings/[bookingId]/payments/success
  Frontend calls: POST /api/payments/complete
  Request: { sessionId: "cs_xxx", bookingId: "123" }
  
Step 7: Backend Updates Records
  Backend:
    - Creates Payment record (status='paid')
    - Updates Booking (status='confirmed')
    - Calculates platform fee & company earnings
    - Stores: totalPrice, platformFee, companyEarnings
  
Step 8: Company Receives Booking
  Company sees new booking in: /company/bookings
  Status: 'confirmed' (ready to assign staff)
  
Step 9: Payment Record Created
  Payment table contains:
    - bookingId
    - userId (customer)
    - amount, currency
    - status: 'paid'
    - method: 'card'
    - transactionRef: "pi_xxx"
    - paidAt: timestamp
  
Step 10: Revenue Split
  Booking table contains:
    - totalPrice: $100
    - platformFee: $10 (10%)
    - companyEarnings: $90 (90%)
  
  Later (payout to company):
    - Admin/System triggers payout to company bank account
    - Company receives $90
```

---

## 👷 STAFF ASSIGNMENT FLOW

```
┌─────────────────────────────────────────────────────────────┐
│                 STAFF ASSIGNMENT PROCESS                    │
└─────────────────────────────────────────────────────────────┘

Step 1: Booking is Confirmed (After Payment)
  Booking: { id: 123, status: 'confirmed', companyId: 5, assignedStaffId: null }
  
Step 2: Company Admin Views Booking
  Route: /company/bookings
  API: GET /api/companies/bookings?status=confirmed
  Shows all confirmed bookings without assigned staff
  
Step 3: Company Views Booking Details
  Route: /company/bookings/[id]
  API: GET /api/bookings/123
  Response shows:
    - Customer details
    - Service requested
    - Date & time
    - Location
    - Payment status
  
Step 4: Company Checks Available Staff
  Same page shows staff list
  API: GET /api/companies/staff
  Filters by:
    - status: 'active'
    - Check availability on booking date/time
  
Step 5: Company Assigns Staff
  Button: "Assign Staff" → Opens modal with staff list
  User selects staff member
  Frontend calls: POST /api/companies/assign-staff
  Request: {
    bookingId: 123,
    staffId: 45
  }
  
Step 6: Backend Updates Booking
  Backend:
    - Updates booking: assignedStaffId = 45
    - May update status to 'in_progress' (optional)
    - Notifies staff (create notification)
  
Step 7: Staff Receives Notification
  Staff sees new job in: /staff/bookings
  API: GET /api/staff/bookings
  Shows their assigned bookings
  
Step 8: Staff Views Job Details
  Route: /staff/bookings/[id]
  API: GET /api/staff/bookings/123
  Shows:
    - Customer info
    - Service details
    - Date, time, location
    - Status
  
Step 9: Staff Manages Job
  Actions available:
    → Start Job: POST /api/bookings/123/start
    → Update Progress: PATCH /api/bookings/123/progress (progress: 50%)
    → Complete Job: POST /api/bookings/123/complete
  
Step 10: Job Completion
  When staff marks complete:
    - Booking status → 'completed'
    - Customer notified
    - Customer can leave review
```

---

## 📁 COMPLETE FRONTEND FOLDER STRUCTURE

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   └── forgot-password/
│   │
│   ├── customer/
│   │   ├── layout.tsx (uses CustomerSidebar)
│   │   ├── dashboard/
│   │   │   └── page.tsx → APIs: GET /bookings, /payments, /reviews/my
│   │   ├── services/
│   │   │   ├── page.tsx → API: GET /categories
│   │   │   └── [category]/
│   │   │       └── [serviceType]/
│   │   │           ├── page.tsx → API: GET /companies/categories/{cat}/service-types/{type}
│   │   │           └── company/
│   │   │               └── [id]/
│   │   │                   ├── page.tsx → API: GET /companies/:id/details
│   │   │                   └── booking/
│   │   │                       └── page.tsx → API: POST /bookings
│   │   ├── bookings/
│   │   │   ├── page.tsx → API: GET /bookings (customer's bookings)
│   │   │   └── [bookingId]/
│   │   │       ├── page.tsx → API: GET /bookings/:id
│   │   │       └── payments/
│   │   │           ├── page.tsx → API: POST /payments/checkout-session
│   │   │           └── success/
│   │   │               └── page.tsx → API: POST /payments/complete
│   │   ├── payments/ → API: GET /payments
│   │   ├── reviews/
│   │   │   ├── page.tsx → API: GET /reviews/my
│   │   │   └── new/ → API: POST /reviews
│   │   ├── profile/ → API: GET /users/:id, PUT /users/:id
│   │   └── messages/
│   │       └── [id]/ → API: GET /conversations/:id
│   │
│   ├── company/
│   │   ├── layout.tsx (uses CompanySidebar)
│   │   ├── dashboard/
│   │   │   └── page.tsx → APIs: GET /companies/bookings, /payments, /staff, /reviews/company/:id
│   │   ├── services/
│   │   │   ├── page.tsx → API: GET /services?companyId=X
│   │   │   ├── new/
│   │   │   │   └── page.tsx → API: POST /services
│   │   │   └── [id]/
│   │   │       └── page.tsx → APIs: GET /services/:id, PUT /services/:id
│   │   ├── bookings/
│   │   │   ├── page.tsx → API: GET /companies/bookings
│   │   │   └── [id]/
│   │   │       └── page.tsx → APIs: GET /bookings/:id, POST /companies/assign-staff
│   │   ├── staff/
│   │   │   ├── page.tsx → API: GET /companies/staff
│   │   │   ├── new/
│   │   │   │   └── page.tsx → API: POST /companies/staff
│   │   │   └── [id]/
│   │   │       └── page.tsx → APIs: GET/PUT/DELETE /companies/staff/:id
│   │   ├── reviews/ → API: GET /reviews/company/:id
│   │   ├── payments/ → API: GET /payments (company filter)
│   │   ├── areas/ → API: GET /service-areas (manage coverage)
│   │   └── settings/ → API: GET/PUT /companies/:id
│   │
│   ├── staff/
│   │   ├── layout.tsx (uses StaffSidebar)
│   │   ├── dashboard/
│   │   │   └── page.tsx → APIs: GET /staff/bookings, /staff/services/pending, /staff/availability/me
│   │   ├── schedule/
│   │   │   └── page.tsx → API: GET /staff/bookings (calendar view)
│   │   ├── bookings/
│   │   │   ├── page.tsx → API: GET /staff/bookings
│   │   │   └── [id]/
│   │   │       └── page.tsx → APIs: GET /staff/bookings/:id, POST /bookings/:id/start|complete
│   │   ├── services/
│   │   │   └── page.tsx → APIs: GET /staff/services/pending, PATCH /:id/approve|reject
│   │   ├── availability/
│   │   │   └── page.tsx → APIs: GET/POST/DELETE /staff/availability
│   │   └── profile/ → API: GET/PUT /users/:id
│   │
│   └── admin/
│       ├── layout.tsx (uses AdminSidebar)
│       ├── dashboard/
│       │   └── page.tsx → APIs: GET /users, /companies, /bookings, /payments (counts)
│       ├── users/
│       │   ├── page.tsx → API: GET /users
│       │   └── [id]/
│       │       └── page.tsx → APIs: GET/PUT/DELETE /users/:id, PATCH /users/:id/status
│       ├── companies/
│       │   ├── page.tsx → API: GET /companies
│       │   └── [id]/
│       │       └── page.tsx → APIs: GET/PUT/DELETE /companies/:id
│       ├── categories/ → APIs: GET/POST/PUT/DELETE /categories
│       ├── service-types/ → APIs: GET/POST/PUT/DELETE /service-types
│       ├── analytics/ → Various aggregation APIs
│       ├── verification/ → API: GET /companies?verificationStatus=pending
│       └── settings/ → System settings
│
├── components/
│   ├── layout/
│   │   ├── CustomerSidebar.tsx
│   │   ├── CompanySidebar.tsx
│   │   ├── StaffSidebar.tsx
│   │   ├── AdminSidebar.tsx
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── ui/ (shared components)
│   └── features/ (domain-specific components)
│
└── lib/
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useBookings.ts
    │   ├── useStaff.ts
    │   ├── useCompanies.ts
    │   └── usePayments.ts
    └── api/
        └── client.ts (axios instance)
```

---

## 🎯 QUICK REFERENCE: What Route Uses What API

### Edit vs Detail Pages

#### **Detail Page** (View Only)
- Route: `/resource/[id]` 
- Purpose: Display information, read-only
- Example: `/customer/bookings/[id]` - View booking details

#### **Edit Page** (Modify)
- Route: `/resource/[id]/edit` OR just `/resource/[id]` with edit mode
- Purpose: Update information
- Example: `/company/services/[id]` - Edit service details

#### **New/Create Page**
- Route: `/resource/new`
- Purpose: Create new record
- Example: `/company/staff/new` - Add new staff member

---

## 🚀 NEXT STEPS FOR IMPLEMENTATION

1. **Start with Dashboards**
   - Implement data fetching for each dashboard
   - Create summary cards/widgets
   - Add charts for metrics

2. **Build Booking Flow**
   - Complete customer booking pages
   - Test payment integration
   - Implement staff assignment UI

3. **Complete CRUD Operations**
   - Services (company)
   - Staff (company)
   - Users (admin)
   - Service Types (admin)

4. **Add Real-time Features**
   - Notifications
   - Message system
   - Booking status updates

5. **Polish & Test**
   - Error handling
   - Loading states
   - Responsive design
   - User feedback (toasts, modals)

---

**Need clarification on any specific flow? Just ask!** 🎉
