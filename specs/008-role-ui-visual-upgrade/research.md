# Research: Non-Customer Role UI Visual Upgrade & Text Distillation

**Feature**: `specs/008-role-ui-visual-upgrade`  
**Date**: 2026-10-05  
**Domain**: Mobile Design Systems, High-Glanceability Ergonomics, Text Distillation

---

## 1. Visual Hierarchy & Micro-Badge Design Tokens

### Decision
Standardize non-customer UI tokens around a clean, high-contrast dark navy / slate palette with vibrant semantic status accents:
- **Surface**: Pure white (`#FFFFFF`) with subtle border lines (`#E2E8F0`) and light slate backdrops (`#F8FAFC`).
- **Accent & Primary**: Deep Obsidian Navy (`#0A192F` / `#0F172A`).
- **Semantic Badges**:
  - `Urgent / Live`: Amber glow (`#FEF3C7` bg, `#D97706` text, `#F59E0B` pulse dot).
  - `Active / On Shift / Success`: Emerald glow (`#ECFDF5` bg, `#059669` text, `#10B981` dot).
  - `Traveling / En Route`: Purple badge (`#FAF5FF` bg, `#7E22CE` text).
  - `Arrived / Waiting`: Cyan badge (`#ECFEFF` bg, `#0E7490` text).
  - `Overdue / Breach`: Rose badge (`#FEF2F2` bg, `#DC2626` text).

### Rationale
- Non-customer operators (technicians on the road, dispatchers monitoring active queues, superadmins reviewing fraud/disputes) experience severe cognitive fatigue when reading paragraphs of text.
- Standardizing micro-badges and semantic color tokens enables operators to decode status, urgency, and action in under 2 seconds.

### Alternatives Considered
- *Using colored backgrounds for entire cards*: Rejected because full-card color saturation creates visual noise and reduces readability in bright outdoor sunlight.
- *Relying only on icons without text labels*: Rejected because icons alone can introduce ambiguity (e.g., distinguishing "En Route" from "Arrived"). Pairing compact iconography with a 1-to-2-word label provides optimal clarity and accessibility.

---

## 2. Replacing Descriptive Paragraphs with Visual Milestone Steppers

### Decision
In `frontend-expo/app/(staff)/(tabs)/today.tsx`:
1. Remove all long instructional guidance blocks, checklist explanation paragraphs, and verbose status banners.
2. Introduce a compact horizontal **Visual Milestone Stepper**:
   - 4 discrete progress nodes: `En Route` (Compass) $\rightarrow$ `Arrived` (MapPin) $\rightarrow$ `Working` (Wrench) $\rightarrow$ `Complete` (CheckCheck).
   - Filled track with pulse animation indicating current progress.
3. Transform the active assignment card into a high-glanceability dashboard:
   - Top row: Service badge + Payout chip (`+$45.00`).
   - Middle row: Destination address with 1-tap navigation button, distance meter (`2.4 km`), and customer contact shortcuts (Call / Chat).
   - Bottom row: High-contrast full-width thumb-friendly primary action button.

### Rationale
- Field technicians operate primarily while on the move or standing at a client's front door. They need actionable buttons, not reading material.
- A visual stepper eliminates guesswork about the current stage of the service.

### Alternatives Considered
- *Vertical accordion stepper*: Takes too much vertical screen real estate, pushing primary action buttons below the fold on compact devices.
- *Hidden modal for details*: Requires extra taps; key data should remain visible on the card at all times.

---

## 3. High-Density Dispatch Board & Pro Radar Ergonomics

### Decision
In `frontend-expo/app/(company)/(tabs)/operations.tsx` and `staff.tsx`:
1. Condense booking cards to high-density operational rows:
   - Visual urgency indicator: Countdown timer badge (`12m left` in amber, `<5m` in pulsing red).
   - Proximity chip: Distance to nearest available technician.
   - Quick "Assign" pill on unassigned cards opening the streamlined `AssignStaffModal`.
2. On `staff.tsx`:
   - Replace wordy role and shift paragraphs with live status rings (pulsating green for online, solid amber for on-job, gray for offline).
   - Add 1-tap call and chat icon pills directly on each technician row.

### Rationale
- High-volume dispatchers manage dozens of concurrent bookings. Compact rows double the information density per screen, drastically reducing scroll distance.

---

## 4. Financial Ledger Visual Clarity & Text Removal

### Decision
In `frontend-expo/app/(staff)/(tabs)/money.tsx` and `app/(company)/(tabs)/finance.tsx`:
1. Remove generic payroll disclaimers ("Your earnings are tracked automatically and disbursed directly...").
2. Highlight key numerical figures in clean, large-format typography:
   - Net Earnings, Completed Jobs, Hours Online.
   - Physical Cash Collected: Highlighted in a dedicated visual cash card with an unremitted balance meter and a warning badge when reaching company remittance limits.
3. In company finance: Replace verbose banking text with a structured field crew cash reconciliation table and 1-tap "Settle" action.

### Rationale
- Business owners and contractors care about numbers, balances, and reconciliation status. Long explanatory text wastes valuable vertical screen space and hides important financial alerts.

---

## 5. Strict Customer Screen Isolation Boundary

### Decision
Enforce a hard boundary: **Zero changes to `frontend-expo/app/(customer)/**` or customer-specific components**.
All visual enhancements and text removals are strictly localized to:
- `frontend-expo/app/(staff)/**`
- `frontend-expo/app/(company)/**`
- `frontend-expo/app/(admin)/**`
- Shared admin/company components in `frontend-expo/components/admin/**` or `frontend-expo/components/company/**`.

### Rationale
- Directly honors the user's explicit directive: *"dont change anything on customer"*.
- Protects the validated customer direct-booking workflow from any accidental regressions.
