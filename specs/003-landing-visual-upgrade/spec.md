# Feature Specification: ServiceFinder Landing Page Visual & Graphical Experience Upgrade

**Feature Branch**: `003-landing-visual-upgrade`  
**Feature Directory**: `specs/003-landing-visual-upgrade`  
**Created**: 2026-09-25  
**Status**: Draft  
**Input**: User description: "upgrade with more visual pls i just feel it is more text"  

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Rich Visual Hero & Interactive GPS Dispatch Simulation (Priority: P1) 🎯 MVP

A visitor (prospective service company owner or homeowner) arrives on the ServiceFinder landing page and is immediately captivated by an immersive visual hero rather than a dense wall of text. The hero features an interactive, high-fidelity visual simulator of the ServiceFinder Dispatch & Live GPS Tracking ecosystem:
- A visual interactive map showing Phnom Penh landmarks (Toul Kork, BKK1, Sen Sok) with animated technician vehicle markers, dynamic arrival route lines, and real-time status pulses.
- An interactive Bakong KHQR checkout visual popover displaying an authentic Cambodian KHQR bill with a dynamic settlement badge.
- Visual metric gauges and graphical micro-charts illustrating live marketplace dispatch speed (e.g., 28-min arrival gauge, 99.4% satisfaction meter).

**Why this priority**: First impressions are formed within 50 milliseconds. Replacing plain text blocks with rich, interactive device simulations and authentic map graphics immediately establishes platform authority, boosts conversion, and eliminates the "text-heavy" feeling.

**Independent Test**: A user lands on the page and can interact with the visual map simulator (switch active technician routes, trigger simulated Bakong KHQR completion), experiencing immediate graphical feedback without needing to read paragraphs of copy.

**Acceptance Scenarios**:
1. **Given** a visitor viewing the hero section on desktop or mobile, **When** they look at the primary visual display, **Then** they see a rich, interactive simulated dispatch map with live technician markers, route vectors, and status pills rather than static text.
2. **Given** a visitor interacting with the live simulation, **When** they click "Simulate Dispatch" or select a route, **Then** the map animates the technician marker moving along the route and triggers a visual Bakong KHQR instant payout receipt.
3. **Given** any screen size from mobile (320px) to ultra-wide (2560px), **When** the visual simulation renders, **Then** it scales proportionally without clipping, visual distortion, or text overlap.

---

### User Story 2 - Trade Photography & High-Impact Visual Category Showcase (Priority: P2)

A homeowner browsing for home maintenance services encounters a visually stunning, image-rich category showcase. Instead of plain minimalist icon cards with paragraphs of descriptions, each trade category (Air Conditioning, Electrical, Plumbing, Cleaning, Handyman, Solar) is presented with:
- High-resolution, professional trade photography depicting real technician work (AC chemical cleaning, circuit board testing, pipe manifold repairs, pristine commercial spaces).
- Interactive "Before & After" visual comparison sliders for cleaning and HVAC restorations.
- Prominent visual price badges (e.g., "$15.00 Starting Baseline") and verified trade license seal emblems.

**Why this priority**: Service marketplace conversion relies on visual proof of quality. Homeowners need to see the caliber of work before booking tradespeople to enter their homes.

**Independent Test**: A visitor can browse the category showcase, slide the visual Before/After scrubber on high-resolution trade images, and visually distinguish between different service tiers with zero visual stutter.

**Acceptance Scenarios**:
1. **Given** a user exploring service categories, **When** they view the category grid, **Then** each trade card features authentic, high-quality visual trade imagery with subtle gradient contrast overlays and verified provider badges.
2. **Given** a user inspecting the AC or Deep Cleaning category, **When** they drag the interactive Before/After image comparison scrubber, **Then** the image reveals the pristine post-service transformation smoothly in real time.
3. **Given** a user clicking a category card, **When** the card transitions, **Then** a smooth visual micro-interaction highlights the starting price and directs to marketplace offerings.

---

### User Story 3 - Visual Revenue Growth Charts & Connected Ecosystem Flow Diagram (Priority: P3)

A prospective service business partner evaluating the platform wants to see visual financial projections and understand how the platform components connect end-to-end:
- The Partner Growth Calculator is upgraded with a dynamic visual comparison bar chart comparing "Traditional Manual Revenue" vs. "ServiceFinder Automated Revenue", animating proportionally as the technician slider moves.
- A visual 4-step connected pipeline diagram replaces plain text explanation: Homeowner Mobile (1-Click Book) ──[Pulse Vector]──> Cloud Dispatch Board (Auto-Match) ──[GPS Route]──> Technician Mobile (Job Done) ──[Bakong Rail]──> Company Bank Account (Instant Settlement).
- Visual trust seals: Official National Bank of Cambodia Bakong KHQR emblem, Ministry of Commerce licensing seal, and Escrow Vault security badge.

**Why this priority**: Business owners make financial decisions based on visual charts and clear system architecture diagrams rather than bulleted lists.

**Independent Test**: A business owner adjusts the technician slider and observes the comparative visual chart animate its bar heights dynamically, while also tracing the illuminated 4-step ecosystem pipeline flow.

**Acceptance Scenarios**:
1. **Given** a company owner adjusting the technician slider, **When** the slider value changes, **Then** the comparative revenue bar chart dynamically updates its bar heights with animated numeric counters.
2. **Given** a visitor inspecting the "How ServiceFinder Works" section, **When** they scroll into view, **Then** a connected visual workflow diagram illuminates step-by-step showing the live data and payment flow between all 3 platform stakeholders.
3. **Given** a user reviewing platform security, **When** they view the trust section, **Then** they see graphical certificate seals and escrow vault emblems rather than plain text lists.

---

### Edge Cases

- **Slow Network / Asset Loading**: All high-resolution imagery and visual mockups must include optimized low-res placeholders (blur-up / skeleton pulse) so no empty or broken layouts appear during download.
- **High-DPI / Retina Displays**: All SVG graphics, vector map overlays, and device frames must render at 2x/3x crisp pixel density without blurriness.
- **Reduced Motion Accessibility**: For users with `prefers-reduced-motion: reduce`, animated route vectors, chart height transitions, and pulsing beacons must immediately render in their final resting state without looping animations.
- **Mobile Viewport Constraints**: The Before/After comparison scrubber and interactive dispatch map must support intuitive touch dragging gestures on mobile screens without hijacking vertical page scrolling.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST replace text-heavy hero displays with an interactive, visual **Live Dispatch & GPS Simulator** rendering a stylized vector map of Phnom Penh, animated technician arrival routes, and live status pills.
- **FR-002**: System MUST render an authentic visual **Bakong KHQR Payment Modal Simulation** showcasing real national QR graphics, payment confirmation badges, and instant checkmark animations.
- **FR-003**: System MUST provide rich trade photography for all service category cards (Air Conditioning, Electrical, Plumbing, Cleaning, Handyman, Solar) featuring high-resolution visuals of professional technicians at work.
- **FR-004**: System MUST feature an interactive **Before/After Image Comparison Scrubber** allowing users to visually inspect real home service results (e.g. AC deep cleaning, room restoration).
- **FR-005**: System MUST upgrade the Partner ROI Calculator with a dynamic visual **Comparative Revenue Bar Chart** rendering animated comparative bars ("Manual Phone Dispatch" vs. "ServiceFinder OS").
- **FR-006**: System MUST present an illuminated, step-by-step **Visual Connected Ecosystem Pipeline Diagram** displaying animated data and payment vectors connecting Homeowner, Dispatcher, Technician, and Company Bank.
- **FR-007**: System MUST display high-credibility **Graphical Trust Seals & Emblems** including the National Bank of Cambodia Bakong KHQR official seal, Ministry of Commerce licensing emblem, and Escrow Vault security badge.
- **FR-008**: System MUST integrate visual testimonial showcase cards with verified technician portraits, company fleet imagery, and customer satisfaction metric rings.
- **FR-009**: System MUST preserve seamless bilingual Khmer/English support across all visual graphics, chart axes, and interactive simulation labels.
- **FR-010**: System MUST adhere strictly to Anti-"AI Slop" visual guidelines: authentic local trade photography, zero generic foreign corporation logos, crisp 1px structural borders, and purposeful contrast ratios.

---

### Key Entities

- **VisualSimulatedRoute**: Models a live dispatch simulation on the vector map, including starting coordinates, technician name, trade specialty, customer location, transit path coordinates, and ETA in minutes.
- **VisualTradeCard**: Models a trade category preview card with background photography URL, icon overlay, starting price, provider count, and Before/After image comparison assets.
- **VisualChartProjection**: Models the comparative revenue data points (manual revenue vs. platform-optimized revenue) rendered in the dynamic bar chart visualization.
- **VisualEcosystemNode**: Models a step in the connected platform pipeline diagram (icon, title, stakeholder type, animated connection path).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: **Visual Density Score**: Reduce text-to-visual ratio across the viewport from 80/20 to at least 45/55, ensuring that every viewport fold contains at least one prominent interactive graphic, visual chart, or trade photo.
- **SC-002**: **Interactive Engagement Duration**: Increase average time-on-page from under 40 seconds to over 90 seconds driven by interactive map simulation and Before/After scrubber engagement.
- **SC-003**: **Performance Budget Compliance**: First Contentful Paint (FCP) maintained under 1.2s and Largest Contentful Paint (LCP) under 2.2s through modern WebP image optimization and vector SVG graphics.
- **SC-004**: **Mobile Gesture Fluidity**: 60fps gesture response on mobile touch interactions (Before/After scrubber and slider controls) with zero stutter.
- **SC-005**: **Zero AI-Slop Authenticity**: 100% of photographic and graphical assets reflect genuine trade work, authentic Cambodian financial rails, and realistic local operating environments.

---

## Assumptions

- The visual upgrade builds directly upon the existing Next.js App Router structure and modular components in `frontend/components/landing/*`.
- High-resolution trade images are optimized and served locally or via high-performance CDNs (Unsplash curated trade photography / local SVG assets) with WebP compression.
- Responsive touch gesture events are compatible with mobile Safari and Chrome on Android.
- All visual upgrades maintain complete backward compatibility with existing auth routes (`/auth/register`, `/auth/login`) and service exploration endpoints (`/services`).
