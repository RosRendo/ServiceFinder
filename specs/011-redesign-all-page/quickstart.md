# Quickstart & End-to-End Validation Guide: Clean Business Admin Portal

**Feature**: `011-redesign-all-page` | **Date**: 2026-10-06  
**Scope**: Verification procedures for clean business styling, structured hierarchy, and unified workflows across all admin mobile screens.

---

## Prerequisites
1. Backend NestJS running on port 3000 (`npm run start:dev` in `backend-nest`).
2. Mobile Expo running on port 8081 (`npx expo start` in `frontend-expo`).
3. An active user session with `ADMIN` or `SUPERADMIN` role credentials.

---

## Scenario 1: Sober Executive Command & SLA Triage Validation

**Objective**: Verify that the dashboard uses institutional charcoal and subtle semantic dots instead of playful rainbow fills.

1. Launch Expo app and sign in with admin credentials.
2. Navigate to **Dashboard** (`/(admin)/(tabs)/dashboard`).
3. **Verify visual discipline**:
   - The Gross Merchandise Volume card renders in deep institutional slate (`#0A192F`) with crisp white metrics and zero candy gradients.
   - The SLA action matrix displays three triage cards (Verifications, Disputes, Payouts) with neutral surfaces (`#FFFFFF` with `#E2E8F0` hairline border) and discrete indicator dots rather than loud multi-colored fills.
   - Tapping any triage card navigates directly to the designated queue (`Approvals`, `Issues`, or `Payouts`).
4. Scroll to the bottom of the dashboard.
5. **Verify safe bottom inset**:
   - The final card sits cleanly above the floating pill tab bar with `paddingBottom: 120` clearance.

---

## Scenario 2: High-Density Business Verification & Credential Inspection

**Objective**: Verify that the approvals queue presents company applications in structured two-column ledgers with smooth tab switching.

1. In the bottom navigation bar, tap **Approvals** (`/(admin)/(tabs)/queue`).
2. **Verify segmented control**:
   - Four status tabs are available: `Pending`, `Reviewing`, `Approved`, `Rejected`.
   - Switching between tabs updates the vertical FlashList instantaneously without horizontal gesture conflicts.
3. Review an onboarding company card.
4. **Verify structured business ledger**:
   - Registration number, business owner, phone number, and submission date are cleanly arranged in key-value pairs with hairline dividers.
   - Tap **Inspect Business Credentials**.
   - The document inspector drawer expands cleanly.
   - Tapping the document thumbnail opens a full-screen preview modal.
5. Tap **Verify Business** or **Reject**.
6. **Verify action execution**:
   - Application status updates, optimistic feedback indicates success, and the item transitions to the corresponding tab.

---

## Scenario 3: Institutional Dispute Mediation & Escrow Settlement Safeguard

**Objective**: Verify that dispute cases display comparative claimant vs provider evidence and require a two-step confirmation with written justification.

1. In the bottom navigation bar, tap **Issues** (`/(admin)/(tabs)/issues`).
2. **Verify scannable dispute list**:
   - Each dispute displays an exact monetary escrow hold badge and color-graded SLA timer (overdue / urgent / clean).
   - Tap any open dispute to enter the case details (`/(admin)/disputes/[id]`).
3. **Verify comparative evidence layout**:
   - Top custodial ribbon displays exact held escrow funds (`$XX.XX`).
   - Side-by-side comparative cards summarize Claimant statements and Provider defense.
4. Tap **Open Settlement Safeguard**.
5. **Verify two-step safeguard modal**:
   - Step 1: Select settlement action (`Full Customer Refund`, `50/50 Escrow Split`, or `Release to Provider`).
   - Enter an audit justification note (e.g. "Customer provided photographic evidence of incomplete work").
   - Tap **Review & Verify Safeguard**.
   - Step 2: The binding confirmation screen displays the financial warning, exact disbursement sum, claimant, provider, and the entered audit note.
   - Tap **Execute Settlement**.
   - Case resolves, funds are disbursed, and audit note is committed.

---

## Scenario 4: Unified Corporate Governance & Secondary Tools Audit

**Objective**: Verify that settings and secondary administrative tools share cohesive headers, back buttons, and safe bottom clearance.

1. In the bottom navigation bar, tap **More** (`/(admin)/(tabs)/settings`).
2. **Verify Operations Hub hierarchy**:
   - Categorized into clear sections: Financial Governance, Platform Governance & Telemetry, Marketplace Configuration, Marketing & Communications, and Executive Security.
3. Tap **Payout Batches** (`/(admin)/payouts`).
   - Verify: Executive header displays back arrow, batch cards are structured, and bottom padding is `paddingBottom: 120`.
   - Tap back arrow to return to Operations Hub.
4. Tap **Refunds Ledger** (`/(admin)/refunds`).
   - Verify: Mobile layout stacks responsively, pending queue items render cleanly, and bottom padding is `paddingBottom: 120`.
   - Tap back arrow.
5. Tap **System Audit Trail** (`/(admin)/audit`) and **Infrastructure Health** (`/(admin)/monitoring`).
   - Verify: Consistent institutional styling, back arrow navigation, and zero text truncation.
