# Quickstart Guide: Staff Experience Verification

**Feature**: `012-staff-experience-alignment`
**Date**: 2026-10-06

---

## 1. Running the Mobile App
Ensure Expo server is running:
```bash
cd frontend-expo
npx expo start
```

---

## 2. Testing Staff Drawer Navigation
1. Log in as a technician (or use staff credentials).
2. Open the navigation drawer by swiping or tapping the menu icon.
3. Verify each link routes to an active screen with zero errors:
   - **Live Dispatch** ➜ `/(staff)/(tabs)/today`
   - **My Availability** ➜ `/(staff)/availability`
   - **Shift Earnings** ➜ `/(staff)/(tabs)/money`
   - **Staff Profile** ➜ `/(staff)/(tabs)/me`
   - **Job History** ➜ `/(staff)/history`
   - **Performance Score** ➜ `/(staff)/performance`
   - **Request Leave** ➜ `/(staff)/timeoff`
   - **AI Job Diagnostics** ➜ `/(staff)/ai/ai`
   - **Contact Dispatch** ➜ `/(staff)/messages/new`

---

## 3. Testing Visual Hierarchy & Mobile Clearance
1. Open the **Shift Earnings** tab (`Money`).
   - Confirm pure white cards (`#FFFFFF`), hairline borders (`#E2E8F0`), and deep charcoal text (`#0F172A`).
   - Scroll to the bottom of the list and verify the last card clears the floating tab bar cleanly (`paddingBottom: 120`).
2. Open the **Staff Profile** tab (`Profile`).
   - Confirm card layout and navigation rows render with corporate cockpit tokens.

---

## 4. Validating Code Integrity
Run TypeScript verification:
```bash
npx tsc --noEmit
```
Expected output: Exited with code 0 (zero errors).
