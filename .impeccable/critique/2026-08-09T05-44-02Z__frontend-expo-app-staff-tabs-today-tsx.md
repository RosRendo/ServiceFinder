---
target: frontend-expo/app/(staff)/(tabs)/today.tsx
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
timestamp: 2026-08-09T05-44-02Z
slug: frontend-expo-app-staff-tabs-today-tsx
---
# Impeccable Design Critique: Staff Role Tabs
**Target:** `frontend-expo/app/(staff)/(tabs)/today.tsx` and `money.tsx`

---

## Design Health Score
The interface has been evaluated against Nielsen's 10 Usability Heuristics on a 0-4 scale:

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Good step indicators ('TRAVELING', 'WORKING'), but no clear indicator when offline vs. online search is connecting. |
| 2 | Match System / Real World | 4 | Solid metaphors (radar pulse for job search, maps, swipe-to-complete actions). |
| 3 | User Control and Freedom | 3 | Staff can cancel job detail sheets, but there is no "undo" if they swipe a step by mistake. |
| 4 | Consistency and Standards | 4 | Standard color scheme (`T.success` and `#0A192F` dark navy) matches across both screens. |
| 5 | Error Prevention | 3 | Swipe-to-complete prevents accidental clicks, but picking a job is a single-click action without a confirmation prompt. |
| 6 | Recognition Rather Than Recall | 4 | Map pins show open jobs visually, making it easy to see what is nearby without searching lists. |
| 7 | Flexibility and Efficiency | 2 | No search filters for jobs, no batch operations, and no quick keyboard shortcuts or action toggles. |
| 8 | Aesthetic and Minimalist Design | 4 | Extremely clean dark navy (`#0A192F`) and mint green (`#00A699`) contrast on white sheets. Minimalist and spacious. |
| 9 | Error Recovery | 3 | Graceful handling of `409 Conflict` (job already taken) with a clear alert box. |
| 10 | Help and Documentation | 1 | No help section, FAQs, or contact support buttons visible within these primary tabs. |
| **Total** | | **31/40** | **Good (77.5%)** |

---

## Design Specificity Verdict

* **LLM Assessment:** The visual aesthetics are highly professional and follow an "Uber-like" execution flow. Using a map background with absolute overlay cards feels extremely premium. However, the interactions are a bit rigid: there's no manual list view alternative for jobs, and physical workflows (like snapping photos on-site) are treated as file picker selections. The typography hierarchy and color contrast are excellent.
* **Deterministic Scan:** Automated checks returned clean (`[]` violations), indicating strong code-level CSS/style compliance.
* **Visual Overlays:** Not applicable. Running on a native mobile platform (Expo), so browser overlay injection was bypassed.

---

## Overall Impression
A highly polished, visually stunning foundation that behaves like a real-world dispatch app. The single biggest opportunity is transforming the rigid file-upload workflow into a native camera experience and connecting the motivation dashboard with actual wallet actions.

---

## What's Working
1. **Swipe-To-Complete Micro-interactions:** The custom `SwipeToComplete` slider for high-stakes steps (check-in and complete job) feels tactile and prevents accidental state changes.
2. **Radial Pulse Search Animation:** The scale-animated radar circle in the `WAITING` state gives immediate visual feedback that the app is actively working in the background.

---

## Priority Issues

### [P1] No Direct Camera Option for Proof of Work
* **Why it matters:** Completing a job requires uploading a photo. Clicking "UPLOAD & FINISH" only triggers `launchImageLibraryAsync` (photo library). Mobile workers on-site need to take a photo directly within the app rather than exiting to their camera app first.
* **Fix:** Change image picking to support direct camera capture via `ImagePicker.launchCameraAsync`.
* **Suggested command:** `$impeccable shape`

### [P2] Confusing "CANCEL" Button on Job Board
* **Why it matters:** Tapping an open job pin displays details with a "CANCEL" button. This wording is ambiguous; it sounds like it might cancel the booking or job itself, rather than simply closing the detail drawer.
* **Fix:** Change the button label from "CANCEL" to "Close" or "Dismiss".
* **Suggested command:** `$impeccable clarify`

### [P2] Confused Navigation from Earnings to Cashout
* **Why it matters:** The "Motivation" (Money) screen tracks completion rates and earnings, but has no call-to-action to request a payout. Staff members looking at their balance will expect a direct way to withdraw or view payout methods.
* **Fix:** Add a "Withdraw Earnings" or "Payout Options" button on the Motivation card.
* **Suggested command:** `$impeccable layout`

### [P2] Missing Pull-To-Refresh on Job Board
* **Why it matters:** There is no way to refresh the list of available jobs without toggling offline and online again, which frustrates workers waiting for fresh work.
* **Fix:** Add a small floating refresh button over the MapView or support a pull-to-refresh container.
* **Suggested command:** `$impeccable layout`

### [P3] Hardcoded Safe Area / Bottom Tab Paddings
* **Why it matters:** The bottom sheet uses height-based hardcoded padding (`110` vs `90` pixels) to dodge the bottom tabs. This will clip buttons or look awkward on different device form factors (e.g., iPhone Dynamic Island screens vs. notch-less Androids).
* **Fix:** Implement `useSafeAreaInsets` to adjust padding dynamically based on actual device safe areas.
* **Suggested command:** `$impeccable adapt`

---

## Persona Red Flags

* **Alex (Power User):** Cannot quickly refresh the job board to grab high-paying gigs first. Is forced to toggle online/offline manually. Will find the workflow slow.
* **Jordan (First-Timer):** Might hesitate to tap "CANCEL" on the job details pin, fearing it will cancel the job, and might not know where to go to request their first payout from the motivation tab.
* **Casey (Distracted Mobile User):** Rushing on-site and cannot snap a photo directly to complete the job; gets stuck trying to switch apps to take a photo first.

---

## Questions to Consider
1. What if we added a list-view toggle for jobs so staff don't have to rely entirely on tapping map pins?
2. Should we support a "Working Offline" state for jobs where cellular connectivity is unstable?
