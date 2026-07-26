# 16. Customer Role Bible
**Module:** `(customer)`
**Status:** 10/10 Enterprise Grade

This document serves as the absolute source of truth for the Customer Module (the app interface for the end-users booking services). It defines the business logic for discovery, booking, live tracking, and checkout, adhering strictly to the 18-Point Page Specification format.

---

## PART 1: Core System Flows

### 1. Discovery & Search Flow
**Trigger:** Customer opens the app.
1. **Location Context:** The app immediately requests location permissions (if not granted) to sort services and companies by proximity.
2. **Category Selection:** Customer browses rich, image-heavy categories (e.g., Plumbing, Cleaning, Handyman).
3. **Company Profiles:** Customer taps a company to view their portfolio, verified reviews, and available service menu.

### 2. Booking & Checkout Flow
**Trigger:** Customer selects a service to book.
1. **Scheduling:** Customer selects a Date and Time Slot based on the Company's active availability calendar.
2. **Details:** Customer enters the exact address (with map pin adjustment) and uploads optional photos of the issue.
3. **Pre-Authorization:** Customer enters payment details (Stripe / Apple Pay / Google Pay). The card is **pre-authorized** (a hold is placed on the funds), but *not* charged until the job is completed by the staff.
4. **Queueing:** Booking enters the "Pending" state in the Company's Urgent Action Queue.

### 3. Live Tracking Flow
**Trigger:** Company Staff taps "Start Navigation".
1. **Notification:** Customer receives an SMS and Push Notification: "Your pro, John, is on the way!"
2. **Live Map:** Customer opens the tracking screen to see the staff member's live GPS location moving on the map, alongside an ETA.
3. **Communication:** Customer can one-tap call or message the staff member through an in-app masked routing system.

### 4. Completion & Tipping Flow
**Trigger:** Staff marks the job "Completed" and uploads proof photos.
1. **Sign-off:** Customer physically signs the Staff's device (if present).
2. **Payment Capture:** Stripe captures the pre-authorized funds.
3. **Review & Tip:** App prompts the customer to rate the service 1-5 stars and presents quick-tap Tip options (e.g., 15%, 20%, 25%, Custom). Tips route directly to the staff's wallet.

---

## PART 2: Screen Specifications (18-Point Format)

### Screen: Customer Home / Discovery (`(customer)/(tabs)/home.tsx`)

**PAGE SPECIFICATION**
1. **Purpose:** The storefront. Help users quickly find and book trusted local services.
2. **Layout:** Vertical scroll. Top: Address selector and global search bar. Middle: Horizontal scrolling Category Pills. Bottom: Vertical list of "Top Rated Near You" Company Cards.
3. **Components:** Location Header, SearchBar, Category Carousel, Company Listing Card (Image, Rating, Distance, Tags).
4. **Buttons:** "Search" (Keyboard Action), Category Pills.
5. **User Interaction Flow:**
   * Customer opens app -> Taps 'Plumbing' pill -> Screen filters to show only plumbing companies within a 20-mile radius -> Taps Company card to view details.
6. **Business Logic:**
   * Companies with an average rating below 3.0 are severely downranked in the default algorithm.
   * "Near You" strictly calculates Haversine distance based on device coordinates vs company HQ coordinates.
7. **Permissions:** Customer (or Guest mode with limited features).
8. **API Integration:** `GET /api/companies/search?category=X&lat=Y&lng=Z`
9. **Notifications:** N/A.
10. **Loading State:** Shimmering skeleton cards for the company listings.
11. **Empty State:** "We haven't expanded to your city yet! Join the waitlist."
12. **Error State:** "Failed to load services. Check your connection."
13. **Warning State:** "Location services disabled. Showing default city."
14. **Micro Animations:** Parallax scrolling on company cover images.
15. **AI Features:** "AI Recommended for You" section based on seasonal trends (e.g., AC Repair in Summer).
16. **Design Constraints:** Images must be compressed heavily (WebP) to ensure the infinite scroll does not crash on low-end devices.
17. **Page Relationships:** Affects -> Company Profile Screen.
18. **Future Features:** AR measuring tool to estimate room sizes for cleaning services.

---

### Screen: Booking Checkout (`(customer)/checkout.tsx`)

**PAGE SPECIFICATION**
1. **Purpose:** Securely collect payment pre-authorization and finalize the booking contract.
2. **Layout:** Stack layout. Service Summary at the top. Address Map in the middle. Price Breakdown and Payment Input at the bottom.
3. **Components:** Summary Card, Static Map View (showing destination), Line Item Breakdown (Base, Taxes, Fees), Stripe PaymentSheet Button.
4. **Buttons:** "Confirm & Pay" (Primary, Sticky at bottom), "Change Address" (Ghost).
5. **User Interaction Flow:**
   * Customer reviews total -> Taps "Confirm & Pay" -> Native Apple Pay/Google Pay sheet slides up -> Authenticates with FaceID -> Success Checkmark Animation -> Redirects to "Upcoming Bookings".
6. **Business Logic:**
   * The payment is a `SetupIntent` or a `PaymentIntent` with `capture_method: 'manual'`.
   * The Platform Fee (e.g., $2.50 trust & safety fee) is explicitly broken out in the line items.
7. **Permissions:** Authenticated Customer only.
8. **API Integration:** `POST /api/bookings/checkout-session`
9. **Notifications:** "Booking Request Sent" email and push.
10. **Loading State:** Spinning loader on the "Confirm" button preventing double-taps.
11. **Empty State:** N/A.
12. **Error State:** Stripe Card Declined Error ("Insufficient funds").
13. **Warning State:** "This time slot is in high demand, the company may take up to 2 hours to confirm."
14. **Micro Animations:** Slide-up bottom sheet for adding a new credit card.
15. **AI Features:** N/A.
16. **Design Constraints:** The total price must always remain visible on the screen, adhering to strict consumer transparency laws.
17. **Page Relationships:** Affects -> Company Urgent Action Queue.
18. **Future Features:** "Buy Now, Pay Later" (Klarna/Affirm integration).

---

### Screen: Live Staff Tracking (`(customer)/booking/[id]/tracking.tsx`)

**PAGE SPECIFICATION**
1. **Purpose:** Provide Uber-like transparency for when the staff will arrive.
2. **Layout:** Split View. 70% Live Map (Top). 30% Staff Info & Controls Bottom Sheet.
3. **Components:** `MapView` with polyline route, Moving Car/Avatar Marker, ETA Text, Staff Profile Row (Avatar, Name, Rating).
4. **Buttons:** "Call Staff" (Green), "Message" (Blue), "Cancel Booking" (Danger - hidden under options menu).
5. **User Interaction Flow:**
   * Customer gets notification -> Taps it -> Map opens showing staff driving -> ETA updates every 10 seconds -> Staff arrives, map turns into "Job In Progress" state.
6. **Business Logic:**
   * Map only becomes active when the booking status changes to `en_route`.
   * If status is `in_progress`, the map dims and focuses on a timer.
7. **Permissions:** Associated Customer only.
8. **API Integration:** WebSocket connection to `/ws/tracking?bookingId=X`.
9. **Notifications:** "Your Pro has arrived!"
10. **Loading State:** Map zooming into coordinates.
11. **Empty State:** N/A.
12. **Error State:** "Lost connection to Pro's GPS."
13. **Warning State:** "Pro is experiencing heavy traffic, ETA delayed by 5 mins."
14. **Micro Animations:** The staff pin smoothly interpolates between GPS coordinates rather than jumping abruptly.
15. **AI Features:** N/A.
16. **Design Constraints:** The bottom sheet must be draggable but snap to 30% and 10% heights.
17. **Page Relationships:** Affects -> Staff Location Ping.
18. **Future Features:** Live streaming from the technician's body-cam (extreme enterprise trust feature).
