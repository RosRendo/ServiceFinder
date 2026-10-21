# Quickstart Validation Guide: Role Flow Hierarchy

**Feature**: `specs/007-role-flow-hierarchy`  
**Date**: 2026-10-05  
**Prerequisites**:
- Backend NestJS running on `http://localhost:5000`
- Expo dev server running in `frontend-expo`
- Seeded test accounts (Staff, Company Admin, Platform Superadmin)

---

## 1. Role 1: Field Technician Fast-Track Flow

### Step 1.1: Log in & Shift Availability
1. In the Expo mobile app, sign in using staff credentials (`staff@example.com` / `password123`).
2. Verify root router lands directly on `(staff)/(tabs)/today`.
3. Toggle the Shift Switch in the top header from **"Offline"** to **"On Shift"**.
4. **Expected Outcome**: Header changes to active green "Online / Ready for Dispatch"; backend updates `User.workingStatus = 'online'`.

### Step 1.2: Milestone Lifecycle Progression
1. On the `today` screen, locate the active assigned booking.
2. Tap **"En Route"** $\rightarrow$ Verify card state updates to "On the Way" and directions shortcut activates.
3. Tap **"Arrived"** $\rightarrow$ Verify card state updates to "Arrived on Site".
4. Tap **"Start Service"** $\rightarrow$ Verify timer begins counting up and status updates to "In Progress".
5. Tap **"Complete Job"**:
   - Attach or select a photo verification.
   - Enter physical cash collected: `$45.00`.
   - Tap **"Submit & Finish"**.
6. **Expected Outcome**: Booking transitions to `completed`, removes from active assignments, and credits `$45.00` to the pro's unremitted cash ledger under `(staff)/(tabs)/money`.

---

## 2. Role 2: Company Dispatch & Fleet Reconciliation Flow

### Step 2.1: Receive & Assign Incoming Booking
1. Switch account or sign in as company admin (`company@example.com` / `password123`).
2. Verify root router lands on `(company)/(tabs)/dashboard`.
3. Switch to `(company)/(tabs)/operations`.
4. Locate an unassigned booking in the pending queue.
5. Tap **"Assign Staff"** $\rightarrow$ Modal opens displaying company technicians sorted by proximity and active status.
6. Select an online technician and tap **"Confirm Allocation"**.
7. **Expected Outcome**: Booking status transitions to `assigned`; selected technician receives push notification and job appears on their daily itinerary.

### Step 2.2: Cash Audit & Financial Reconciliation
1. Switch to `(company)/(tabs)/finance`.
2. Inspect the **Technician Cash Ledger** section.
3. Verify the technician from Role 1 shows `$45.00` unremitted cash.
4. Tap **"Settle Cash"** to record physical turnover.
5. **Expected Outcome**: Technician unremitted cash resets to `$0.00`; company available balance reflects the settled amount.

---

## 3. Role 3: Platform Superadmin Quality & Governance Flow

### Step 3.1: Company Credential Vetting
1. Sign in as platform superadmin (`admin@example.com` / `password123`).
2. Verify root router lands on `(admin)/(tabs)/dashboard`.
3. Navigate to `(admin)/(tabs)/companies`.
4. Filter by status: `Pending Verification`.
5. Tap on a pending company record to view registration license and ID credentials.
6. Tap **"Approve & Verify"**.
7. **Expected Outcome**: Company verification status updates to `verified`; company services immediately become searchable in customer marketplace.

### Step 3.2: Dispute Arbitration
1. Navigate to `(admin)/(tabs)/issues`.
2. Open an active customer dispute case.
3. Review customer claim, provider notes, and attached completion photo.
4. Select arbitration action: **"Refund Customer"** with amount `$25.00`.
5. Tap **"Confirm Resolution"**.
6. **Expected Outcome**: Dispute status updates to `resolved`, payment record updates to `refunded`, and customer receives refund confirmation.

---

## 4. Verification Check Reference
- API Contracts:
  - [staff-api.yaml](file:///d:/FOR%20RENDO%20(ONLY%20)/Personal%20Project/Service_Finder/specs/007-role-flow-hierarchy/contracts/staff-api.yaml)
  - [company-api.yaml](file:///d:/FOR%20RENDO%20(ONLY%20)/Personal%20Project/Service_Finder/specs/007-role-flow-hierarchy/contracts/company-api.yaml)
  - [admin-api.yaml](file:///d:/FOR%20RENDO%20(ONLY%20)/Personal%20Project/Service_Finder/specs/007-role-flow-hierarchy/contracts/admin-api.yaml)
- Data Model: [data-model.md](file:///d:/FOR%20RENDO%20(ONLY%20)/Personal%20Project/Service_Finder/specs/007-role-flow-hierarchy/data-model.md)
