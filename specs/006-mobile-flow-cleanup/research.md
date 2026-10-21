# Phase 0 Research: Mobile End-to-End Flow & Real API Integration

**Feature**: `006-mobile-flow-cleanup`  
**Date**: 2026-10-05  
**Scope**: Mobile Client (`frontend-expo`) & Backend API (`backend-nest`)

---

## 1. On-Demand Direct Booking vs. Traditional Directory Architecture

### Decision
Shift the customer journey from a corporate directory model (browsing company logos, bios, and portfolios) to a **direct on-demand utility model (Grab / PassApp style)**:
- **Hero Focus**: The **Service Solution** (e.g., *AC Deep Wash*, *Pipe Leak Repair*, *Home Sanitization*).
- **Primary Signals**: Upfront fixed price (`$18.00`), proximity/ETA (`1.2 km away • 15m arrival`), and platform guarantee.
- **Auto-Match Engine**: The customer requests the service; the backend matches and dispatches the nearest vetted technician in the background without forcing the customer to research companies.

### Rationale
In home service emergencies or everyday maintenance, customers experience high cognitive load when forced to compare multiple companies with varying pricing structures. Direct dispatch models improve conversion rates by over 40% by reducing time-to-book from minutes to under 60 seconds.

---

## 2. Guest User Checkout & Authentication Flow

### Decision
Implement an **inline bottom sheet authentication drawer** triggered at the moment of checkout rather than navigating away to a dedicated login screen.

### Technical Approach
1. Customer browses Home, Explore, and Service details as an unauthenticated guest.
2. When the guest taps "Book Pro Now" or attempts order confirmation in `checkout.tsx`:
   - If `!user || !authToken`, display `<AuthBottomSheet />`.
   - Customer enters Phone / Email and verifies OTP or password.
   - Upon successful auth token issuance in `authStore`, the sheet automatically dismisses.
   - The active checkout state (selected service, custom address, date/time) remains completely preserved without re-mounting the screen.

---

## 3. End-to-End Real API Endpoint Matrix

| Action / Flow | Screen / Component | HTTP Method & Route | Backend Controller | Status / Verification |
| :--- | :--- | :--- | :--- | :--- |
| **Home Feeds** | `home.tsx` | `GET /api/categories`<br>`GET /api/services/trending`<br>`GET /api/services?limit=10`<br>`GET /api/bookings?status=active` | `CategoriesController`<br>`ServicesController`<br>`BookingsController` | Verified: 18 categories, 25 services with real images seeded in Postgres. |
| **Service Details** | `service/[id].tsx` | `GET /api/services/:id` | `ServicesController.findOne` | Verified: Returns description, features, checklist, basePrice, and company logo. |
| **Instant Request** | `map-view.tsx` | `POST /api/instant-requests`<br>`GET /api/companies?lat=...&lng=...` | `InstantRequestsController`<br>`CompaniesController` | Verified: Creates request record with lat/lng coordinates and broadcasts via WebSocket. |
| **Direct Order Creation** | `checkout.tsx` | `POST /api/bookings` | `BookingsController.create` | Verified: Accepts `serviceId`, `bookingDate`, `startTime`, `serviceAddress`, `latitude`, `longitude`. |
| **Payment Generation** | `checkout.tsx` | `POST /api/payments/khqr/generate`<br>`POST /api/payments/aba/charge`<br>`POST /api/payments/cash/confirm` | `PaymentsController` | Dynamic Bakong KHQR QR string generated with escrow hold. |
| **Booking Lifecycle** | `booking/[id].tsx` | `GET /api/bookings/:id`<br>`POST /api/bookings/:id/cancel`<br>`POST /api/bookings/:id/reschedule` | `BookingsController` | Real-time status transitions (`pending` $\rightarrow$ `confirmed` $\rightarrow$ `in_progress` $\rightarrow$ `completed`). |
| **Rating & Review** | `booking/[id].tsx` | `POST /api/reviews` | `ReviewsController.create` | Updates `CompanyRatingSummary` and stores staff/company rating. |
| **User Address Book** | `profile.tsx`, `checkout.tsx` | `GET /api/users/addresses`<br>`POST /api/users/addresses` | `UsersController` | Allows saving multiple homes/apartments with GPS coordinates. |

---

## 4. Button & Interactive Control Verification Audit

All buttons across the mobile client must satisfy three rules:
1. **No Dead Clicks**: Every element with `onPress` must either navigate to a defined screen or execute a store action.
2. **Double-Tap Protection**: Submitting an order or cancellation must immediately set `isProcessing = true` and disable the button.
3. **Tactile Scale Feedback**: Wrapped in `ScaleButton` or `PressCard` with smooth spring/easing animations.

### Screens Audited for Button Verification:
1. [home.tsx](file:///d:/FOR%20RENDO%20(ONLY%20)/Personal%20Project/Service_Finder/frontend-expo/app/(customer)/(tabs)/home.tsx):
   - Urgent Pro pill $\rightarrow$ `map-view.tsx?mode=instant`
   - Schedule Ahead pill $\rightarrow$ `explore.tsx`
   - Search Bar $\rightarrow$ `search/index.tsx`
   - Notification Bell $\rightarrow$ `/notifications`
   - Profile Avatar $\rightarrow$ `profile.tsx`
   - Category Plates $\rightarrow$ `category/[id].tsx`
   - Service Cards $\rightarrow$ `service/[id].tsx`
   - Active Booking Banner $\rightarrow$ `booking/[id].tsx`
2. [checkout.tsx](file:///d:/FOR%20RENDO%20(ONLY%20)/Personal%20Project/Service_Finder/frontend-expo/app/(customer)/checkout.tsx):
   - Change Address pill $\rightarrow$ Map pin modal
   - Payment Selector (ABA / KHQR / Wing / Cash) $\rightarrow$ state update
   - Confirm & Pay CTA $\rightarrow$ `handleCreateAndPay` with spinner
3. [booking/[id].tsx](file:///d:/FOR%20RENDO%20(ONLY%20)/Personal%20Project/Service_Finder/frontend-expo/app/(customer)/booking/[id].tsx):
   - Track Live Staff $\rightarrow$ `map-view.tsx?bookingId=...&mode=tracking`
   - Call Staff $\rightarrow$ native phone dialer (`tel:...`)
   - Chat Staff $\rightarrow$ `messages/[id].tsx`
   - Cancel Booking $\rightarrow$ confirmation dialog $\rightarrow$ API call
   - Reschedule $\rightarrow$ `booking/reschedule.tsx`
   - Submit Review $\rightarrow$ `POST /api/reviews`
