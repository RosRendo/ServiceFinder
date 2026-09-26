# Phase 0 Research: ServiceFinder Landing Page Visual & Graphical Experience Upgrade

**Feature**: ServiceFinder Landing Page Visual & Graphical Upgrade  
**Branch**: `003-landing-visual-upgrade`  
**Date**: 2026-09-25  
**Status**: Completed  

---

## 1. Research Topic: Interactive Vector Map & Live Dispatch Simulator

### Context & Problem Statement
The hero section previously relied on static text and small UI cards. To wow users and provide an immediate visual demonstration of the platform's power, we need an interactive map showing live dispatching and GPS arrival in Phnom Penh. Loading full Google Maps or Mapbox tiles on the landing page hero adds 1.5MB+ of JavaScript, incurs cloud API costs, and slows FCP/LCP.

### Decision
Implement a custom stylized vector SVG map canvas (`DispatchMapSimulator.tsx`) modeling Phnom Penh's key commercial and residential districts:
- Districts mapped: Toul Kork, Boeung Keng Kang 1 (BKK1), Daun Penh, Sen Sok, and Chroy Changvar.
- Vector transit paths with animated SVG stroke pulses representing active technician dispatches.
- Interactive technician cards that, when clicked, animate the vehicle pin along the route and update the ETA badge in real time.
- Integrated visual Bakong KHQR checkout modal popover demonstrating instant settlement upon simulated work completion.

### Rationale & Alternatives
- *External Mapbox/Google Maps tiles*: Rejected. Heavy initial bundle, requires API tokens that can be scraped or throttled, slow initial paint.
- *Stylized SVG canvas*: Chosen. Ultra-lightweight (<15KB), 60fps vector animations, zero external dependencies, 100% responsive across mobile and 4K displays.

---

## 2. Research Topic: Interactive Before/After Image Comparison Scrubber

### Context & Problem Statement
Homeowners evaluating home service providers need immediate visual proof of quality. Plain text descriptions of "AC deep clean" or "post-renovation cleaning" do not generate emotional conviction.

### Decision
Implement a pure React touch-friendly Before/After comparison slider (`BeforeAfterScrubber.tsx`):
- Uses CSS `clip-path` (`inset(0 calc(100% - ${sliderPosition}%) 0 0)`) over dual layered high-resolution trade images.
- A vertical divider handle with dual arrow indicators and drag physics supporting both mouse drag and touch gestures (`onTouchMove`).
- Touch-action optimization (`touch-action: pan-y`) ensuring vertical page scrolling remains fluid while horizontal scrubbing operates smoothly.
- Real trade scenarios:
  1. Air Conditioning: Dusty, clogged evaporator coils vs. pristine, chemically washed silver fins.
  2. Deep Cleaning: Grimy post-construction tile & grout vs. sparkling, polished living space.

---

## 3. Research Topic: Dynamic Comparative Revenue Bar Chart

### Context & Problem Statement
The Partner ROI calculator displayed four text numbers in boxes. While informative, business owners respond much more strongly to visual height comparisons showing how much money they are leaving on the table with manual dispatching.

### Decision
Upgrade the calculator with an animated comparative visual bar chart (`ComparativeRevenueChart.tsx`):
- Bar 1: **"Traditional Manual Operations"** (Grey/Slate bar, based on 2.2 jobs/day with transit downtime).
- Bar 2: **"ServiceFinder Automated OS (+35%)"** (Vibrant Blue/Emerald gradient bar, showing optimized 3.5 jobs/day).
- Both bars dynamically scale their relative heights and tabular dollar values as the technician slider moves from 1 to 50.
- Pure CSS transition heights (`transition: height 300ms cubic-bezier(0.4, 0, 0.2, 1)`) with zero charting library overhead.

---

## 4. Research Topic: Connected 4-Node Ecosystem Pipeline Flow

### Context & Problem Statement
Explaining the 3-sided marketplace (Customer -> Dispatcher -> Technician -> Bank) in text requires reading multiple paragraphs. A visual flowchart with illuminated signal pulses conveys the entire architecture in under 3 seconds.

### Decision
Implement a visual connected pipeline diagram (`EcosystemPipeline.tsx`):
- Node 1: Homeowner Mobile App (`Smartphone` icon, "Instant 30s Booking")
- Connecting Pulse: Animated vector signal
- Node 2: Company Cloud Dispatch (`Monitor` icon, "3-Click Proximity Auto-Match")
- Connecting Pulse: Animated GPS route vector
- Node 3: Technician Companion (`Navigation` icon, "Turn-by-Turn GPS Arrival")
- Connecting Pulse: Animated Bakong settlement rail
- Node 4: Company Bank Account (`Landmark` icon, "Instant KHQR USD Payout")
- Visual signal pulses travel sequentially between nodes, creating an alive, reactive visual heartbeat.

---

## 5. Research Topic: Curated Trade Photography & Visual Asset Strategy

### Context & Problem Statement
Per system instructions and anti-slop guidelines: "Avoid simple minimum viable products, don't use placeholders, if you need an image use high-quality assets".

### Decision
Curate professional, authentic trade photography with WebP optimization:
- AC HVAC Service: Professional technician cleaning indoor unit with pressure washer and safety bag.
- Electrical Wiring: Certified electrician using digital multimeter and testing circuit breaker panels.
- Plumbing & Fixtures: Clean modern copper piping, pressure valves, and leak diagnostics.
- Deep Cleaning: High-end residential living space after professional janitorial treatment.
- Handyman Services: Precision power tool repair on home appliances.
- Solar & Inverters: Roof installation of high-efficiency monocrystalline solar panels in Phnom Penh.
- Include subtle bottom-to-top dark gradient overlays (`bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent`) so typography and price badges have certified WCAG AA contrast against any photograph.
