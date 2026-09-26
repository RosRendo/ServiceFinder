# Quickstart & Validation Guide: Clean Management UI

**Feature**: Clean Management UI (Company & Admin Refit)  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)  
**Date**: 2026-09-25  

---

## 1. Prerequisites

1. Node.js 20+ and npm installed.
2. PostgreSQL database running with Prisma migrations applied (`cd backend-nest && npx prisma migrate deploy`).
3. Backend service running on `http://localhost:3000` (`npm run start:dev` in `backend-nest`).
4. Web frontend running on `http://localhost:3001` or `3000` (`npm run dev` in `frontend`).
5. Expo dev server running (`npx expo start` in `frontend-expo`).

---

## 2. Validation Scenarios

### Scenario 1: Superadmin Verification Flow (Web)
1. **Navigate**: Open browser to `http://localhost:3001/admin/verification`.
2. **Visual Inspection**:
   - Verify table uses crisp 1px borders (`#E2E8F0`) and standard typography without rainbow gradients.
   - Verify status pills use quiet semantic tokens (e.g. Amber for `Pending`).
3. **Action Flow**:
   - Click any pending company row.
   - Confirm slide-over drawer opens smoothly from the right with business details and document preview.
   - Click "Approve Company".
   - Confirm status updates optimistically to soft green "Approved" without full page reload.

### Scenario 2: Company Dispatch & Staff Assignment (Web & Mobile)
1. **Web Flow**:
   - Log in as Company Admin and navigate to `/company/bookings`.
   - Select an unassigned booking row.
   - Open assignment dropdown, pick an available staff member, click "Assign".
   - Verify immediate status transition from "Pending" to "Assigned" with zero visual jumps.
2. **Mobile Flow**:
   - Open Expo app under Company Admin role (`/(company)/(tabs)/today` or bookings).
   - Verify cards are compact, high-density, and free of rainbow borders.
   - Tap an active booking to verify the bottom-sheet detail view.

### Scenario 3: Destructive Action Safeguard (Web)
1. **Navigate**: Open `http://localhost:3001/admin/companies`.
2. **Trigger Action**: Click row actions menu (`...`) on a test company and select "Suspend Company".
3. **Verify Modal**:
   - Confirm confirmation modal appears with mandatory reason code dropdown.
   - Confirm "Suspend" button is disabled until a reason is selected.
   - Confirm cancellation cleanly aborts the action without state mutation.

### Scenario 4: Automated Component & Quality Checks
Run the automated test suites to ensure zero lint errors and correct contract adherence:

```bash
# Web frontend unit & component tests
cd frontend
npm run test:unit

# Mobile TypeScript & lint verification
cd ../frontend-expo
npx tsc --noEmit
npx expo lint
```

---

## 3. Visual "Anti-AI-Slop" Audit Checklist

When reviewing any redesigned screen, verify:
- [ ] No gradient backgrounds or glowing drop-shadows on buttons/cards.
- [ ] Table headers stay sticky during vertical scrolling.
- [ ] Row hover is a calm `#F8FAFC`, not bright blue or purple.
- [ ] Monospace font is used for timestamps, monetary amounts, and reference IDs.
- [ ] Empty states show a clear next action rather than oversized decorative illustrations.
