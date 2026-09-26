# Phase 1 Quickstart Validation Guide: Landing Page Visual Upgrade

**Feature**: ServiceFinder Landing Page Visual & Graphical Upgrade  
**Branch**: `003-landing-visual-upgrade`  
**Date**: 2026-09-25  
**Status**: Ready for Validation  

---

## 1. Prerequisites & Launch Dev Server

```bash
cd frontend
npm run dev
```

Navigate to `http://localhost:3000` in your web browser.

---

## 2. Visual Validation Scenarios

### Scenario 1: Interactive Phnom Penh Dispatch Map & Vehicle Simulation
- **Action**: View the hero section visual container.
- **Verification**:
  - A stylized vector map of Phnom Penh appears with district tags (Toul Kork, BKK1, Daun Penh, Sen Sok).
  - An animated technician icon pulses along the active transit route line with an ETA badge ("8 mins away").
  - Click on another dispatch row (e.g. "BKK1 Electrical Repair"); the map route dynamically transitions to the new coordinates.
  - Click "Simulate Settlement / Bakong KHQR" on a settled order; an authentic Bakong KHQR payment popover triggers with a celebration checkmark badge.

### Scenario 2: High-Resolution Trade Photography & Before/After Scrubber
- **Action**: Scroll to the "Verified Trades" category section.
- **Verification**:
  - Each service card is transformed with vibrant, professional trade photography (AC cleaning, circuit diagnostics, modern plumbing).
  - Locate the featured "Before & After Transformation" card (e.g. AC Evaporator Coil Restoration).
  - Drag the vertical scrubber handle horizontally with your mouse or mobile touch gesture.
  - The dusty "Before" image cleanly reveals the sparkling silver "After" coil with 60fps responsiveness.

### Scenario 3: Dynamic Comparative Revenue Bar Chart
- **Action**: Scroll to the "Partner Growth Simulator" section.
- **Verification**:
  - Next to the technician slider, an animated comparative visual bar chart displays:
    1. **"Traditional Manual Operations"** (Grey bar, 2.2 jobs/day)
    2. **"ServiceFinder Automated OS"** (Vibrant Blue/Emerald bar, 3.5 jobs/day +35% boost)
  - Drag the technician slider from 5 to 15. Both bars smoothly animate their heights and tabular dollar amounts.

### Scenario 4: Connected 4-Node Ecosystem Pipeline Flow
- **Action**: Scroll to the "How ServiceFinder Works" section.
- **Verification**:
  - A visual 4-step flowchart connects Homeowner Mobile -> Cloud Dispatch -> Technician GPS -> Company Bank Account.
  - Animated signal pulses travel sequentially between the nodes, conveying real-time data and payment flow.

---

## 3. Automated Test Execution

```bash
# Run unit & component test suite
npx vitest run __tests__/landing/
```
