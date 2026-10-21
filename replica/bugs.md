# Bug Registry: ServiceFinder

**Audit Date**: 2026-10-12  
**Current Release Verdict**: **Shippable** (0 open S1, 0 open S2, 1 minor open S3 enhancement)

---

### Resolved Deficiencies

#### BUG-001: Staff Drawer Navigation Dead Routes
- **Severity**: S2
- **Flow**: F03 Staff Navigation
- **Screen**: S16 / Staff Drawer
- **Issue**: Tapping Schedule, Wallet, or Profile redirected to non-existent route segments.
- **Resolution**: Re-mapped `NAV_GROUPS` to valid physical targets (`/today`, `/availability`, `/money`, `/me`) and implemented route normalization.
- **Status**: Fixed in Feature 012.

#### BUG-002: Bottom Floating Bar Occlusion on Staff Screens
- **Severity**: S3
- **Flow**: F03 Staff Flow
- **Screen**: S13 (`money.tsx`), S14 (`availability`), S15 (`timeoff`), S16 (`me.tsx`)
- **Issue**: Floating bottom navigation pill overlapped the bottom-most action buttons and cards.
- **Resolution**: Enforced `contentContainerStyle={{ paddingBottom: 120 }}` across all scroll views.
- **Status**: Fixed in Feature 012.

#### BUG-003: Admin Portal Lacked Global Bookings Directory
- **Severity**: S2
- **Flow**: F04 / Platform Governance
- **Screen**: S26 (`(admin)/bookings/index.tsx`)
- **Issue**: Admin mobile lacked global booking list compared to web portal.
- **Resolution**: Implemented global bookings directory and inspection dossier.
- **Status**: Fixed in Feature 010.

---

#### BUG-004: Instant Request Broadcast Bidding Flow UI Completion
- **Severity**: S3
- **Flow**: F01 Instant Requests
- **Screen**: S01 / S20
- **Issue**: Companies lacked live visibility into emergency customer broadcast requests in their area and could not submit competitive bids directly.
- **Resolution**: Implemented `GET /api/instant-requests/company-feed`, WebSocket `new_instant_request` broadcast, live broadcast queue section in company mobile operations, and instant bidding modal with custom price and ETA submission.
- **Status**: Fixed in Feature 013.

---

### Active Defects

- **None.** All identified defects resolved (0 open S1, 0 open S2, 0 open S3, 0 open S4).
