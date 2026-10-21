# Quickstart & Validation Guide: Admin Mobile Cockpit

## Prerequisites
1. NestJS backend running on port 3000 (`npm run start:dev` in `backend-nest`).
2. Expo development server running (`npx expo start` in `frontend-expo`).
3. An active user account with the `ADMIN` or `SUPERADMIN` role.

---

## Validation Scenario 1: Executive Dashboard & Safe Scrolling Inset
1. Launch the Expo app and sign in with admin credentials.
2. Navigate to the Admin Dashboard (`/(admin)/(tabs)/dashboard`).
3. **Verify**:
   - The Gross Platform GMV card renders in Obsidian `#0A192F` with trend indicators.
   - Urgent SLA alert items display genuine live counts (no hardcoded fallback "8" or similar).
   - Scroll to the very bottom of the page.
   - **Verify**: The bottom card and list items sit cleanly above the floating tab bar with safe bottom padding (`paddingBottom: 120`).

---

## Validation Scenario 2: Business Approvals Segmented Queue
1. In the bottom floating bar, tap **Approvals** (`/(admin)/(tabs)/queue`).
2. **Verify**:
   - Segmented status tabs are rendered at the top: `Pending Review`, `Under Review`, `Verified`, `Rejected`.
   - Tap **Inspect Credentials** on any pending company card.
   - **Verify**: The credential inspection card opens cleanly showing registration ID, license preview, and business details.
   - Tap **Verify Business**.
   - **Verify**: An optimistic indicator appears, verification completes, and the list updates without screen flash.

---

## Validation Scenario 3: Dispute Mediation Two-Step Safeguard
1. In the bottom floating bar, tap **Issues** (`/(admin)/(tabs)/issues`).
2. Select any open dispute case.
3. Review the customer claim and provider statement.
4. Tap **Resolve Dispute**.
5. **Verify**:
   - A dedicated resolution modal opens asking for resolution outcome (Refund, Split, Release).
   - Enter an administrative note (minimum 10 characters).
   - Confirm the action.
   - **Verify**: Escrow is updated, dispute status transitions to `resolved`, and an audit note is preserved.

---

## Validation Scenario 4: Admin Hub & Sub-Screen Navigation
1. In the bottom floating bar, tap **More** (`/(admin)/(tabs)/settings`).
2. Open the Admin Drawer (`AdminSidebar.tsx`) via the top-left menu icon.
3. **Verify**:
   - Governance modules (Audit Logs, Monitoring, Compliance), Financials (Payouts, Refunds), and Operations (Categories, Service Types, Broadcasts, Promotions) are accessible.
   - Tapping any entry navigates to the respective screen with consistent executive styling and header back buttons.
