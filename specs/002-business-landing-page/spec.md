# Feature Specification: ServiceFinder Business Promotion & Platform Showcase Landing Page

**Feature Branch**: `002-business-landing-page`  
**Feature Directory**: `specs/002-business-landing-page`  
**Created**: 2026-09-25  
**Status**: Draft  
**Input**: User description: "best landing page business you can do to promote and detail about my servicefinder"  

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Prospective Service Company Partner Discovery & Onboarding (Priority: P1) 🎯 MVP

A service business owner (e.g., electrical contractor, HVAC company, plumbing business, cleaning agency) visits the ServiceFinder website looking for ways to expand their revenue, find new clients, and streamline their technician scheduling. They encounter a clear, authoritative business value proposition highlighting automated dispatching, zero upfront software costs, guaranteed customer payments, and instant payouts via Bakong KHQR. They interact with an interactive Partner Growth Calculator to estimate monthly revenue increases, review verified company benefits, and click "Partner With Us" to initiate company registration.

**Why this priority**: Service marketplace platforms cannot grow without supply-side partner acquisition. Attracting and converting quality local service businesses is the highest-leverage growth activity for the ServiceFinder ecosystem.

**Independent Test**: A prospective business owner can land on the page, understand the B2B partner model, configure the interactive revenue estimator for their team size, and submit a partner registration application without errors.

**Acceptance Scenarios**:
1. **Given** an unauthenticated visitor browsing the landing page, **When** they view the hero and partner section, **Then** they see clear, actionable messaging detailing how ServiceFinder provides bookings, handles customer billing, and coordinates field technicians.
2. **Given** a service company owner viewing the "For Businesses" section, **When** they adjust the technician team size slider (e.g., 5 technicians), **Then** the interactive calculator dynamically projects estimated monthly job capacity and potential revenue earnings based on average market booking values.
3. **Given** a partner interested in joining, **When** they click "Register Your Business", **Then** they are guided directly to the streamlined company onboarding flow with pre-populated partner intent.

---

### User Story 2 - Consumer Homeowner Service Discovery & Trust Building (Priority: P2)

A homeowner or business client experiencing an urgent home issue (e.g., leaking pipe, malfunctioning AC, electrical outage) visits ServiceFinder to evaluate whether the platform is trustworthy, fast, and transparent. They are greeted with an intuitive service discovery search bar, prominent verified trade categories (Air Conditioning, Plumbing, Electrical, Cleaning, Appliance Repair), transparent pricing baselines, verified credentials, and customer satisfaction guarantees (escrow-secured payments, background-checked technicians, dispute protection).

**Why this priority**: Consumer conversion requires immediate credibility, transparent pricing, and effortless booking triggers that eliminate anxiety over hiring unknown tradespeople.

**Independent Test**: A homeowner can search for a specific trade, view verified provider ratings and guaranteed response times, and click through to booking without encountering dead links or ambiguous pricing terms.

**Acceptance Scenarios**:
1. **Given** a consumer visiting the landing page, **When** they enter a keyword (e.g., "Air Conditioning") or select a category card, **Then** the page directs them to live available services in their geographic area with transparent pricing.
2. **Given** a visitor evaluating platform safety, **When** they view the "Trust & Safety Architecture" section, **Then** they see concrete security assurances: 100% verified trade licenses, escrow payment protection, and platform dispute mediation guarantees.
3. **Given** a consumer on a mobile device, **When** they click "Download App", **Then** the page presents instant direct links or QR codes for both iOS and Android companion applications.

---

### User Story 3 - Interactive Ecosystem Walkthrough & Khmer/English Resonance (Priority: P3)

A visitor exploring the platform wants to understand how the entire ServiceFinder ecosystem functions before committing. They interact with a 3-way animated "How ServiceFinder Works" walkthrough that demonstrates the unified triangle:
1. **Customer**: Books on mobile with transparent pricing & real-time scheduling.
2. **Company Dispatcher**: Assigns jobs in 3 clicks with automated routing and technician live status.
3. **Field Staff**: Receives job alerts on the mobile companion app, navigates via GPS, and swipes to complete.
The visitor can toggle seamlessly between Khmer (ភាសាខ្មែរ) and English with native typography (Kantumruy Pro & Outfit) and culturally resonant local payment methods (Bakong KHQR, Wing Bank, ABA Pay).

**Why this priority**: Localized product clarity and authentic market resonance convert passive browsers into active believers and platform advocates.

**Independent Test**: A visitor can switch languages between Khmer and English with instantaneous text updates, explore all 3 interactive ecosystem steps, and view Cambodia-specific payment and operational assurances.

**Acceptance Scenarios**:
1. **Given** a user viewing the ecosystem walkthrough, **When** they toggle between "Customer", "Company Admin", and "Field Technician" tabs, **Then** the interactive display updates to showcase the exact interface and workflow for that stakeholder.
2. **Given** a user in Cambodia, **When** they click the language toggle, **Then** all landing page copy switches immediately between Khmer and English with appropriate typographic scaling and zero layout shifts.
3. **Given** a user inspecting platform payments, **When** they review the checkout section, **Then** they see authentic local payment integration badges (Bakong KHQR, ABA Pay, Wing, Visa/Mastercard) rather than generic foreign payment logos.

---

### Edge Cases

- **Slow Network Connectivity**: Video embeds or heavy illustrations degrade gracefully to optimized vector SVG diagrams and lightweight CSS animations with skeleton loading indicators.
- **Extreme Viewport Sizes**: From 320px compact smartphones to 4K ultra-wide monitors, navigation items, metric counters, and category grids adapt responsively without text truncation or awkward horizontal overflow.
- **Language Text Expansion**: Khmer text typically requires 15–25% more horizontal width than English; all buttons, badges, and card titles must use flexbox wrapping and proportional line-heights (`leading-relaxed`) to prevent clipping.
- **Ad-Blocker or Privacy Browser**: Interactive widgets (revenue calculator, tabs) must function entirely via vanilla state logic without depending on third-party tracking scripts.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST feature a high-impact Hero Section articulating the dual value proposition: instant verified home service booking for consumers, and an end-to-end operational growth OS for service companies.
- **FR-002**: System MUST provide an interactive **Partner Growth & ROI Calculator** allowing prospective service companies to adjust team size (1 to 50 staff) and estimate projected monthly bookings and revenue volume.
- **FR-003**: System MUST display popular service category exploration cards (e.g., Air Conditioning, Electrical, Plumbing, Cleaning, Handyman) linking directly to live marketplace listings.
- **FR-004**: System MUST include an interactive **3-Sided Ecosystem Tour** demonstrating the distinct roles of Customers (Booking), Companies (Dispatching), and Technicians (Execution).
- **FR-005**: System MUST showcase real local market payment integration credibility, prominently highlighting National Bank of Cambodia Bakong KHQR, ABA Pay, and credit card processing.
- **FR-006**: System MUST present a dedicated **Trust, Security & Verification Guarantee** section detailing background checks, verified business licenses, dispute mediation safeguards, and upfront pricing guarantees.
- **FR-007**: System MUST provide an authoritative **Company Partnership Comparison Table** contrasting ServiceFinder's automated dispatching, verified customer pipeline, and guaranteed payouts against traditional unorganized offline operations.
- **FR-008**: System MUST incorporate verified social proof: customer testimonials with real ratings, case studies of partner companies growing their operational scale, and real-time marketplace counters (e.g., Total Completed Jobs, Verified Technicians, Average Arrival Time).
- **FR-009**: System MUST support a frictionless global **Language Switcher** between Khmer (ភាសាខ្មែរ) and English, persisting language selection in browser storage.
- **FR-010**: System MUST feature a comprehensive FAQ section addressing top buyer objections (pricing transparency, cancellation policy, warranty guarantee) and partner inquiries (commission rates, payout frequency, equipment requirements).
- **FR-011**: System MUST provide sticky, contextual Conversion CTAs: "Book a Service" for homeowners, "Register as a Provider" for businesses, and "Download App" for mobile users.
- **FR-012**: System MUST adhere strictly to the Anti-"AI Slop" design standard: zero neon rainbow gradients, zero floating decorative blob shapes, 1px subtle structural borders, and purposeful contrast ratios.

---

### Key Entities

- **ProspectivePartnerLead**: Represents a service company owner expressing interest through the calculator or registration CTA; includes trade category, team size, phone number, and location.
- **MarketplaceCategoryPreview**: Represents top consumer categories featured on the landing page with icons, starting price indicators, and provider counts.
- **PlatformTrustPillar**: Represents core platform guarantees (Background Verification, Payment Escrow, Dispute Mediation, Warranty).
- **EcosystemPersona**: Models the three platform participants (Homeowner, Company Admin, Field Technician) with respective feature highlights and device previews.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: **First Contentful Paint (FCP)** under 1.2 seconds and **Largest Contentful Paint (LCP)** under 2.0 seconds on standard 4G mobile connections.
- **SC-002**: **Partner Conversion Rate**: At least 8% of visitors navigating to the "For Business" section interact with the ROI Calculator or click the "Register Company" CTA.
- **SC-003**: **Consumer Booking Funnel Rate**: At least 12% of unique visitors engage with service category cards or search queries to explore marketplace offerings.
- **SC-004**: **Accessibility Compliance**: 100% compliance with WCAG 2.1 AA standards across all text elements, buttons, and form inputs in both English and Khmer language modes.
- **SC-005**: **Zero AI-Slop Visual Purity**: Complete elimination of generic Silicon Valley placeholders (e.g., fake Google/Netflix partner logos), replaced with authentic Cambodian market credentials and genuine platform capabilities.
- **SC-006**: **Responsive Fluidity**: Zero layout breakage, horizontal scrolling, or overlapping text elements across viewports ranging from 320px to 2560px.

---

## Assumptions

- The landing page lives at the root route (`frontend/app/page.tsx`) of the Next.js web application.
- Authentication and registration routes (`/company/register`, `/auth/register`, `/auth/login`) are already operational in the backend and frontend.
- Category listings and service queries integrate with existing backend endpoints (`/api/categories`, `/api/services`).
- Multi-lingual copy utilizes the project's existing Kantumruy Pro font configurations and Next.js localization architecture.
- Mobile companion download links redirect to appropriate store listings or Expo test distributions.
