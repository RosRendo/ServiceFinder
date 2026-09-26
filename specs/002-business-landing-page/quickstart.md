# Phase 1 Quickstart Validation Guide: ServiceFinder Landing Page

**Feature**: ServiceFinder Business Promotion & Platform Showcase Landing Page  
**Branch**: `002-business-landing-page`  
**Date**: 2026-09-25  
**Status**: Ready for Validation  

---

## 1. Prerequisites & Environment Setup

Ensure the Next.js web application environment is operational:
```bash
# Verify Node.js version (v18+ or v20+)
node -v

# Navigate to web frontend directory
cd frontend

# Verify dependencies are installed
npm install
```

---

## 2. Launch Local Development Server

```bash
# Start Next.js dev server on http://localhost:3000
npm run dev
```

Open a modern browser and navigate to `http://localhost:3000`.

---

## 3. Core Validation Scenarios

### Scenario 1: Bilingual Instant Language Switcher
- **Action**: Locate the language toggle in the sticky top navigation (`LandingHeader`).
- **Input**: Click between **"ភាសាខ្មែរ"** (Khmer) and **"English"**.
- **Expected Outcome**:
  - All text across the page (Hero, Calculator, Categories, Ecosystem, FAQs, Footer) updates instantaneously without a full page reload.
  - Khmer text displays rendered in the authentic Suwannaphum font cascade with no clipped buttons or overflowing text.
  - Refresh the browser; the selected language remains preserved via `localStorage.getItem('sf_landing_lang')`.

### Scenario 2: Partner Growth & ROI Calculator Interaction
- **Action**: Scroll to the "Partner Growth & Revenue Calculator" section.
- **Input**:
  - Drag the technician slider from `5` to `12` technicians.
- **Expected Outcome**:
  - `monthlyJobCapacity` dynamically recomputes (e.g., $12 \times 3.5 \times 26 = 1,092$ jobs).
  - `monthlyGrossRevenue` updates smoothly with currency formatting (`$49,140 / mo`).
  - `estimatedNetGrowth` updates to display the +35% platform efficiency uplift (`+$17,199 / mo`).
  - Numbers animate smoothly with zero lag or stuttering (60fps).
  - Clicking "Claim Your Market Share / Register Business" navigates directly to `/auth/register?role=company_admin&teamSize=12`.

### Scenario 3: 3-Way Ecosystem Tour Walkthrough
- **Action**: Scroll to the "How ServiceFinder Works" Ecosystem section.
- **Input**: Click between the three persona tabs:
  1. **"Homeowner App"**
  2. **"Company OS Dispatcher"**
  3. **"Technician Companion"**
- **Expected Outcome**:
  - Tab state updates seamlessly with smooth transition animations.
  - The rendered device mockup switches between the mobile consumer view, the desktop dispatcher kanban/map view, and the field staff mobile completion checklist.
  - Workflow description bullets reflect each stakeholder's exact capability.

### Scenario 4: Anti-"AI Slop" Visual & Credibility Audit
- **Action**: Inspect the hero section, partner marquee, and payment trust badges.
- **Expected Outcome**:
  - Zero generic Silicon Valley corporate logos (e.g., Netflix, Google, Airbnb, Salesforce are absent).
  - Real local fintech credibility: National Bank of Cambodia Bakong KHQR, ABA Pay, and Wing Bank logos are prominently and cleanly rendered.
  - Clean 1px subtle structural borders (`#E2E8F0`), high-contrast typography, and no glowing blurred neon blobs.
  - WCAG 2.1 AA certified contrast across all cards and text elements.

### Scenario 5: Service Category Marketplace Links
- **Action**: Click any service category card (e.g., "Air Conditioning" or "Electrical").
- **Expected Outcome**:
  - Successfully routes to `/services?category=air-conditioning` with transparent baseline pricing displayed.

---

## 4. Automated Testing Commands

Run the component test suite and linter:

```bash
# Run unit & component test suite (Vitest)
npm run test

# Run specific landing page tests
npx vitest run __tests__/landing/

# Run ESLint validation
npm run lint
```
