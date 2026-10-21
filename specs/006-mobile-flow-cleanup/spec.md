# Feature Specification: Mobile End-to-End Flow Audit, Real API Cleanup & Action Verification

**Feature Branch**: `006-mobile-flow-cleanup`

**Created**: 2026-10-05

**Status**: Draft

**Input**: User description: "check all the flow is there need to update all button work? api real clean up everything on mobile"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Direct Service Booking & Checkout Flow (Priority: P1)

As a customer needing home maintenance, I want to select a service, specify my address and preferred time, choose a payment method, and confirm the booking so that a qualified technician is scheduled to arrive at my home.

**Why this priority**: Core revenue-generating engine of the application. If buttons fail, checkout crashes, or API requests are mocked/dead, the application cannot function as a business.

**Independent Test**: Can be fully tested by navigating from Home $\rightarrow$ tapping any service card $\rightarrow$ verifying service details $\rightarrow$ tapping "Book Now" $\rightarrow$ selecting an address and payment mode in Checkout $\rightarrow$ submitting the order $\rightarrow$ landing on the active booking confirmation screen.

**Acceptance Scenarios**:

1. **Given** an authenticated customer on the Home or Explore screen, **When** they tap any service card, **Then** the app navigates to `/(customer)/service/[id]` with full pricing, real imagery, duration, and feature checklist from the backend API.
2. **Given** a customer on the service details screen, **When** they tap "Book Pro Now", **Then** they transition to `/(customer)/checkout` with the service ID, base price, and company details intact.
3. **Given** a customer on the checkout screen, **When** they select an existing address (or add a new address), pick a date/time slot, and tap "Confirm Booking", **Then** the submit button displays an active loading indicator, prevents double taps, creates a real booking via `POST /api/bookings`, and redirects directly to `/(customer)/booking/[id]`.
4. **Given** an unauthenticated guest user attempting to book a service, **When** they tap "Book Pro Now", **Then** the application presents an inline bottom sheet quick-login (preserving all draft selections without redirecting away from the checkout screen).

---

### User Story 2 - Instant "Urgent Pro" Live Dispatch Flow (Priority: P1)

As a customer facing an emergency (e.g. pipe leak, electrical outage), I want to request immediate dispatch based on my current GPS location so that the nearest vetted technician arrives within 15–30 minutes.

**Why this priority**: Differentiates ServiceFinder from traditional directories by delivering Grab/PassApp-level immediate utility.

**Independent Test**: Can be fully tested by tapping "Urgent Pro" on Home $\rightarrow$ opening `map-view.tsx` $\rightarrow$ confirming pickup pin $\rightarrow$ submitting instant request $\rightarrow$ observing live technician search and dispatch status.

**Acceptance Scenarios**:

1. **Given** a customer on Home, **When** they tap "Urgent Pro" (Live Dispatch), **Then** the app requests location permission (or uses cached/Phnom Penh defaults) and opens `map-view.tsx?mode=instant`.
2. **Given** a customer on the instant map view, **When** they submit a dispatch request, **Then** the app calls `POST /api/instant-requests` with latitude, longitude, and category.
3. **Given** an active instant request, **When** submitted, **Then** the platform automatically matches and assigns the single nearest vetted technician immediately (Grab / PassApp on-demand style) and displays live radar ETA tracking.

---

### User Story 3 - Active Booking Tracking & Lifecycle Management (Priority: P2)

As a customer with an active booking, I want to track my assigned technician's arrival in real-time, contact them, or cancel/reschedule if my plans change.

**Why this priority**: Reduces customer anxiety during the waiting window and ensures transparency until job completion.

**Independent Test**: Can be fully tested by opening an active booking from the Home pulse banner or Activity tab $\rightarrow$ viewing technician status $\rightarrow$ testing Call/Chat buttons $\rightarrow$ verifying cancel/reschedule flows.

**Acceptance Scenarios**:

1. **Given** a customer with a booking in `in_progress` or `en_route` status, **When** they view `/(customer)/booking/[id]`, **Then** the screen displays the assigned technician's name, avatar, phone number, vehicle/tool info, and live ETA.
2. **Given** an active booking screen, **When** the customer taps "Call Staff", **Then** the native phone dialer opens with the technician's phone number.
3. **Given** an active booking screen, **When** the customer taps "Chat with Staff", **Then** the app navigates to `/(customer)/booking/messages` linked to that specific booking conversation.
4. **Given** a pending or confirmed booking, **When** the customer taps "Cancel Booking" and provides a reason, **Then** the app calls `POST /api/bookings/:id/cancel` and updates the status badge to `cancelled` with an immediate refund or escrow release.
5. **Given** a completed booking, **When** the customer taps "Leave Review", **Then** they can submit a 1–5 star rating and comment via `POST /api/reviews`.

---

### User Story 4 - Discovery, Search & Category Catalog Navigation (Priority: P2)

As a customer seeking home help, I want to search keywords, filter by category plates, and sort by proximity or price so that I quickly find the right trade service.

**Why this priority**: High-converting top-of-funnel discovery. Every category card, search pill, and filter chip must reliably return matching backend data.

**Independent Test**: Can be fully tested by tapping any Category Plate (e.g., HVAC) $\rightarrow$ verifying only HVAC services appear $\rightarrow$ typing a search query $\rightarrow$ toggling filter chips.

**Acceptance Scenarios**:

1. **Given** a customer on Home, **When** they tap any category (e.g. "Aircon"), **Then** the app navigates to `/(customer)/category/[id]` populated with active services from the backend.
2. **Given** a customer on Home or Explore, **When** they type in the search bar, **Then** results update dynamically with debounced queries to `/api/services?search=...`.
3. **Given** the popular filter chips (`All`, `Aircon`, `Cleaning`, `Plumbing`, `Electrical`), **When** a customer toggles a chip, **Then** the service list filters instantly without flickering or resetting scroll position.

---

### User Story 5 - Account, Saved Addresses & Profile Settings (Priority: P3)

As a returning customer, I want to manage my delivery addresses, view notifications, and update profile settings without dead links or broken UI controls.

**Why this priority**: Retains customer preferences and streamlines repeat checkouts to under 30 seconds.

**Independent Test**: Can be fully tested by opening the Profile tab $\rightarrow$ tapping "Saved Addresses" $\rightarrow$ creating a new address $\rightarrow$ confirming it appears in Checkout.

**Acceptance Scenarios**:

1. **Given** a customer on the Profile tab, **When** they tap "Saved Addresses", **Then** they can view, create, edit, or delete delivery addresses via `/api/users/addresses`.
2. **Given** a customer on Home, **When** they tap the Notification Bell, **Then** they navigate to `/notifications` with read/unread statuses and tap-to-view deep links.
3. **Given** a customer on Profile, **When** they tap "Sign Out", **Then** the auth tokens are cleared from storage, guest state is restored, and they return cleanly to the welcome/home screen.

---

### Edge Cases

- **Network Offline / Server Unreachable**: When network drops, the mobile app must display an unobtrusive top banner ("Offline — showing cached services") and prevent irreversible checkout submissions until connectivity returns.
- **Location Permissions Denied**: If a user rejects GPS permissions, the app MUST NOT crash or freeze; it must smoothly fall back to the default city center (Phnom Penh: 11.5564, 104.9282) and allow manual address entry.
- **Session Expiration During Checkout**: If the JWT access token expires while filling out checkout, the app must attempt silent refresh; if refresh fails, it must prompt for quick re-login and preserve the customer's draft form inputs.
- **Empty States**: If a category or search query returns 0 services, the screen must display a clean, friendly empty state with an actionable "Reset Filters" or "Request Custom Pro" button rather than a blank white screen.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every button, chip, touchable plate, and arrow icon across the customer experience MUST have an explicit `onPress` handler bound to active navigation or an API mutation (zero dead or no-op buttons).
- **FR-002**: All submission buttons (e.g., "Confirm Booking", "Submit Request", "Save Address", "Cancel Booking") MUST provide immediate visual tactile feedback, disable themselves during transit, and display an activity spinner to prevent accidental double-billing.
- **FR-003**: The mobile home, explore, category, and service screens MUST consume real API endpoints (`/api/categories`, `/api/services`, `/api/companies`, `/api/bookings`) populated by the backend seed.
- **FR-004**: Service cards across the application MUST render high-resolution images from the backend with graceful fallback to trade-themed pastel backplates when images are loading or missing.
- **FR-005**: All service cards MUST display upfront, transparent base pricing (`From $XX.00`) and proximity telemetry tags (e.g., `● 15m arrival` or `1.2 km away`).
- **FR-006**: The checkout flow MUST allow selection from saved user addresses or on-the-fly address creation with geocoded coordinates.
- **FR-007**: The checkout flow MUST support Bakong KHQR payment generation and Cash on Arrival selection with clear escrow security guarantees.
- **FR-008**: Successful order creation MUST emit a real `POST /api/bookings` payload, invalidate the local booking cache, and trigger active booking polling/listening.
- **FR-009**: The Active Booking banner on Home MUST automatically appear whenever the authenticated user has an active booking (`pending`, `confirmed`, `en_route`, `arrived`, `in_progress`) and hide when completed or cancelled.
- **FR-010**: The Activity tab MUST segment bookings into active and historical tabs with pull-to-refresh functionality.
- **FR-011**: The booking details screen MUST wire functional deep links for "Call Staff" (`tel:...`) and "Chat with Staff" (`/(customer)/booking/messages`).
- **FR-012**: The app MUST handle unauthenticated guest users gracefully, allowing frictionless browsing of categories and services, and gating order placement via an inline quick-login bottom sheet (phone/email OTP) without discarding draft checkout inputs.
- **FR-013**: The instant dispatch flow ("Urgent Pro") MUST wire `map-view.tsx` to real API endpoints, automatically assigning the single nearest verified technician (Grab / PassApp on-demand model) and displaying live route telemetry.
- **FR-014**: All legacy mock company banners and photo overlays MUST be purged in favor of the unified clean visual card system.
- **FR-015**: The mobile Expo app MUST compile with zero TypeScript diagnostics errors (`npx tsc --noEmit`) and pass all Jest test suites (`npm test`).

---

### Key Entities *(data involved)*

- **Service**: Represents an actionable trade item offered on the platform (e.g., "AC Deep Wash"). Key attributes: `id`, `name`, `description`, `image`, `basePrice`, `discountPrice`, `durationMin`, `features`, `checklist`, `companyId`, `serviceTypeId`.
- **Booking**: Represents a scheduled or on-demand service contract between a customer and a service provider. Key attributes: `id`, `customerId`, `companyId`, `serviceId`, `assignedStaffId`, `status`, `bookingDate`, `startTime`, `serviceAddress`, `latitude`, `longitude`, `totalPrice`, `paymentStatus`.
- **Company**: Represents a licensed local service provider. Key attributes: `id`, `name`, `logoUrl`, `coverImageUrl`, `city`, `address`, `ratingSummary`, `verificationStatus`, `bookingMode`.
- **UserAddress**: Represents a customer's saved location. Key attributes: `id`, `userId`, `label`, `streetAddress`, `city`, `latitude`, `longitude`, `isDefault`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of interactive UI controls across the customer tabs (`home`, `explore`, `activity`, `message`, `profile`) and modals respond to user interaction without dead ends.
- **SC-002**: A customer can navigate from Home to completed booking confirmation in $\le 4$ distinct screen transitions in under 60 seconds.
- **SC-003**: 100% of services displayed in the app showcase real backend images, real descriptions, and accurate upfront pricing without placeholder text (`Lorem Ipsum` or blank boxes).
- **SC-004**: Zero unhandled 401 unauthenticated loop crashes or infinite re-render loops in client network interceptors.
- **SC-005**: Full type safety validation across the mobile codebase: `npx tsc --noEmit` exits with 0 errors, and all unit tests in `frontend-expo` pass with 100% green status.

---

## Assumptions

- The backend NestJS API is running locally or over the local area network on port 5000 with PostgreSQL and Redis accessible.
- The PostgreSQL database is seeded with complete categories, companies, rating summaries, and 25+ real-image services.
- Expo React Native runtime runs on physical devices or emulators via `npx expo start` within the `frontend-expo` package directory.
- Cambodia payments are modeled around Bakong KHQR (dynamic QR) and Cash on Delivery with mock validation for sandbox environments.
