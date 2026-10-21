# Phase 0 Research: Staff Experience Alignment & Navigation Audit

**Feature**: `012-staff-experience-alignment`
**Date**: 2026-10-06
**Status**: Completed

---

## Executive Summary

The purpose of this research is to validate the current state of the Staff mobile application in `frontend-expo/app/(staff)/**`, diagnose discrepancies against the unified platform design system, and determine exact technical adjustments required for navigation, visual tokens, and safe mobile clearance.

---

## Research Inquiries & Resolutions

### 1. Navigation Route Architecture & Sidebar Link Failures

**Problem**:
The drawer sidebar `frontend-expo/components/StaffSidebar.tsx` contained broken links:
- `/(staff)/(tabs)/dashboard` ➜ Target does not exist (Expo router throws unhandled path or 404).
- `/(staff)/(tabs)/schedule` ➜ Target does not exist.
- `/(staff)/(tabs)/messages` ➜ Target does not exist.
- `/(staff)/(tabs)/wallet` ➜ Target does not exist.
- `/(staff)/(tabs)/profile` ➜ Target does not exist.

**Investigation**:
Physical directory inspection in `frontend-expo/app/(staff)` confirms:
- The bottom tabs layout (`(tabs)/_layout.tsx`) exposes 3 active tabs:
  1. `today.tsx` (`route: /(staff)/(tabs)/today`) — Shift Dispatch & Live Route Map.
  2. `money.tsx` (`route: /(staff)/(tabs)/money`) — Shift Earnings, Revenue & Velocity.
  3. `me.tsx` (`route: /(staff)/(tabs)/me`) — Staff Profile, Schedule & Emergency Dispatch.
- Supporting operational routes live outside `(tabs)`:
  - Availability: `/(staff)/availability` (Shift days & hours).
  - Time Off: `/(staff)/timeoff` (Leave requests).
  - Job History: `/(staff)/history` (Completed job archive).
  - Performance: `/(staff)/performance` (Quality ratings & SLA compliance).
  - Direct Messaging: `/(staff)/messages/new` & `/(staff)/chat/[userId]`.

**Resolution**:
Re-map `NAV_GROUPS` in `StaffSidebar.tsx`:
```typescript
const NAV_GROUPS = [
  {
    group: "Daily Shift",
    items: [
      { name: "Live Dispatch", icon: "lightning-bolt-outline", route: "/(staff)/(tabs)/today" },
      { name: "My Availability", icon: "calendar-clock-outline", route: "/(staff)/availability" },
      { name: "Shift Earnings", icon: "currency-usd", route: "/(staff)/(tabs)/money" },
    ],
  },
  {
    group: "Account & Performance",
    items: [
      { name: "Staff Profile", icon: "account-outline", route: "/(staff)/(tabs)/me" },
      { name: "Job History", icon: "history", route: "/(staff)/history" },
      { name: "Performance Score", icon: "chart-line", route: "/(staff)/performance" },
      { name: "Request Leave", icon: "calendar-remove-outline", route: "/(staff)/timeoff" },
    ],
  },
  {
    group: "Support & Tools",
    items: [
      { name: "AI Job Diagnostics", icon: "robot-outline", route: "/(staff)/ai/ai" },
      { name: "Contact Dispatch", icon: "headphones", route: "/(staff)/messages/new" },
    ],
  },
];
```

---

### 2. Design System Alignment & Token Standardization

**Problem**:
The Admin and Company portals were redesigned to follow the institutional cockpit specification:
- Background: `#F8FAFC`
- Surface: `#FFFFFF`
- Borders: Hairline `#E2E8F0`
- Primary text & CTAs: Deep Charcoal `#0F172A`
- Secondary text: Slate `#64748B`, `#475569`
- Status indicators: Discrete dots (`#059669` Emerald, `#D97706` Amber, `#DC2626` Red, `#0284C7` Blue)
In contrast, `(tabs)/me.tsx` and `(tabs)/money.tsx` still defined hardcoded legacy token maps (`#0A192F`, `#F7F8FC`, `#00A699`, `#E31C5F`).

**Resolution**:
Unify tokens across all Staff screens to use standard corporate cockpit tokens. Replace colorful badge fills with discrete semantic indicator dots and clean high-contrast action buttons.

---

### 3. Safe Mobile Clearance (`paddingBottom: 120`)

**Problem**:
Because the Staff tab bar uses a floating pill layout (`FloatingTabBar` with `paddingBottom: 28`), scrollable views without adequate bottom clearance (`paddingBottom: 40` or `paddingBottom: 60`) cause the bottom buttons or earnings rows to be occluded by the floating pill on physical devices.

**Resolution**:
Enforce `contentContainerStyle={{ paddingBottom: 120 }}` on all Staff scroll containers (`today.tsx`, `money.tsx`, `me.tsx`, `history.tsx`, `performance.tsx`).

---

### 4. Preservation of On-Site Execution Integrity

**Validation**:
Staff on-site workflows (`job/[id]/execution.tsx`, `job/[id]/complete.tsx`, and `SwipeToComplete`) already have solid state management and offline buffering (`NetInfo` queue). We must strictly preserve:
- Before/after proof photo capture (`pickImage`).
- Digital signature canvas (`react-native-signature-canvas`).
- GPS route tracking with fallback distance calculation.
- Confetti celebration upon job sign-off.
