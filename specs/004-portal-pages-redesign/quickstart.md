# Quickstart: Auditing, Verifying & Testing Portal Pages

This quickstart guides developers and reviewers through the automated and manual verification of all sidebar pages, buttons, and drawers.

---

## 1. Running the Portal Verification Suite

### A. Run Automated Unit & Page Tests
To verify all management data grids, drawers, and status pills:
```bash
cd frontend
npx vitest run
```

### B. Run ESLint Code Quality Check
Ensure zero linting warnings or unhandled click errors:
```bash
cd frontend
npm run lint
```

---

## 2. Manual Sidebar & Button Verification Procedure

### A. Admin Portal Verification (`/admin/*`)
1. Open `http://localhost:3000/auth/login`.
2. Login with administrative credentials (`admin@servicefinder.kh`).
3. Click through each section of the sidebar:
   - **Overview**: `/admin/dashboard`, `/admin/analytics`, `/admin/reports`
   - **Operations**: `/admin/bookings`, `/admin/settings?tab=general`, `/admin/service-areas`
   - **Trust & Safety**: `/admin/verification`, `/admin/compliance`, `/admin/disputes`, `/admin/moderation`, `/admin/support`
   - **Marketplace**: `/admin/companies`, `/admin/users`, `/admin/staff`
   - **Catalog & Growth**: `/admin/categories`, `/admin/service-types`, `/admin/broadcasts`, `/admin/promotions`, `/admin/featured`
   - **Finance**: `/admin/transactions`, `/admin/payouts`, `/admin/refunds`
   - **Platform Settings**: `/admin/settings`, `/admin/monitoring`, `/admin/emails`, `/admin/audit`
4. On each page:
   - Click a table row: verify a slideover drawer opens smoothly.
   - Click each action button in the drawer: verify it triggers a mutation, modal, or toast.
   - Confirm **zero dead buttons** exist.

### B. Company Portal Verification (`/company/*`)
1. Login with company administrator credentials (`company@servicefinder.kh`).
2. Verify all sidebar routes:
   - `/company/dashboard`, `/company/analytics`, `/company/reports`, `/company/notifications`, `/company/messages`
   - `/company/dispatch`, `/company/bookings`, `/company/schedule`, `/company/staff`
   - `/company/services`, `/company/customers`, `/company/reviews`, `/company/disputes`
   - `/company/wallet`, `/company/transactions`, `/company/revenue`, `/company/commission-rules`, `/company/payouts`, `/company/settings`
3. Inspect each page for monochromatic quiet-luxury card styling, active button responses, and slideover drawer interactions.
