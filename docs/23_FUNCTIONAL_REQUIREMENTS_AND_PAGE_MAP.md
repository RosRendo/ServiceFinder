# Service Finder — Functional Requirements & Page/Flow Map

**Generated:** 2026-08-24 · **Status:** Pre-production (all gates green)
**Stack:** Expo RN (SDK 54) + Next.js 16 web + NestJS 11 API + PostgreSQL (Prisma) + Redis + Socket.IO
**Deploys:** backend-nest → Railway · frontend (web) → Vercel · frontend-expo → app stores

---

## 1. What the product is

A Cambodia-focused home-services marketplace connecting four roles:

| Role | Primary surface | Does |
|---|---|---|
| **Customer** | Expo app | Discovers services, books, pays, tracks staff live, reviews |
| **Company (company_admin)** | Expo app + Web dashboard | Manages catalog, staff, bookings, payouts, KHQR QR codes |
| **Staff** | Expo app | Executes jobs, updates status, shares GPS, requests wage payouts |
| **Admin** | Web dashboard (+ read-only Expo area) | Moderates everything: users, companies, money, disputes, content |

Cross-cutting: instant-request bidding (broadcast a job to nearby companies),
wallet/ledger accounting for companies and staff, KHQR (Cambodian QR) payout images,
OTP phone auth with spend controls, real-time chat + live GPS tracking.

---

## 2. System architecture

```
Expo app ─┐                          ┌─ PostgreSQL (48 models)
Web dash ─┼─► NestJS REST (262 ep) ──┼─ Redis (cache/throttle/presence)
          │      │                   └─ Cloudinary (images)
          │      ├─ Socket.IO ×6 gateways (chat, tracking, presence,
          │      │   booking rooms, instant requests, admin dash)
          │      ├─ Twilio SMS (OTP)   [SMS_PROVIDER=twilio|http|mock]
          │      ├─ ABA PayWay / Wing / KHQR webhooks
          │      └─ Firebase (push), Elasticsearch-ready search module
          └── httpOnly cookie auth (web) / Bearer token (app) — both accepted
```

- Auth: JWT access (~15 min) + rotating refresh tokens in DB; brute-force throttling on OTP verify; per-number OTP caps.
- Money: `Decimal` in DB; every balance move is written inside a Prisma `$transaction` with a ledger row (`Transaction` for companies, `WalletTransaction` for staff).
- Files: single `POST /upload` (JWT-guarded since Aug 2026 hardening).

---

## 3. Functional requirements by role

### 3.1 Public / Authentication
- FR-AUTH-1 Email/password login; phone OTP login.
- FR-AUTH-2 Social sign-in: Google, Facebook, Apple (DTO present).
- FR-AUTH-3 Registration with role selection; email verification.
- FR-AUTH-4 Forgot/reset password via OTP code (60 s resend cooldown, per-number send caps, verify throttled 5/10 min).
- FR-AUTH-5 Session: refresh-token rotation, revocation on password change/logout.
- FR-AUTH-6 MFA (TOTP) optional per user.

### 3.2 Customer (Expo `(customer)` + checkout flows)
- FR-CUS-1 Discovery: home feed (popular/featured), category browse, keyword search, map view of providers.
- FR-CUS-2 Service & company detail pages with ratings/reviews.
- FR-CUS-3 Booking: pick service → date/time slot → address → promo code → checkout → payment (ABA PayWay card/KHQR, Wing).
- FR-CUS-4 Instant Request: broadcast job → nearby companies auto-bid → customer picks a bid → live matching/tracking screens.
- FR-CUS-5 Address book CRUD; saved items (favorites); notifications center.
- FR-CUS-6 Real-time chat with assigned staff/company (typing + read receipts).
- FR-CUS-7 Live GPS tracking of en-route staff on booking detail.
- FR-CUS-8 Booking lifecycle actions: cancel (with policy), reschedule, review after completion.
- FR-CUS-9 Profile management, change password, activity history.

### 3.3 Company (Expo `(company)` + Web `/company`)
- FR-CO-1 Company profile edit (logo, cover, map pin, gmap-link parser).
- FR-CO-2 Service catalog CRUD incl. pricing tiers and discount prices; pricing rules engine (peak surcharges).
- FR-CO-3 Staff management: invite/create staff, set split % or salary, deactivate/reactivate, per-staff wallet view.
- FR-CO-4 Booking queue: accept/decline, assign staff, dispatch center, calendar/schedule views.
- FR-CO-5 Approve/reject **staff payout requests** (reject refunds staff wallet atomically).
- FR-CO-6 Own withdrawals: request payout from available balance (ledger-decremented at request time); KHQR QR image upload shown to admin for payment.
- FR-CO-7 Customer CRM with online presence (socket status).
- FR-CO-8 Reviews moderation view for own company; marketing campaigns; analytics dashboards.
- FR-CO-9 Subscription plan gating (SubscriptionGuard wraps company area).

### 3.4 Staff (Expo `(staff)`)
- FR-STF-1 Today view: assigned jobs with status pipeline (accepted → en_route → in_progress → completed) with photo proof upload.
- FR-STF-2 Live location sharing during en_route (socket `staff_location_update` → customer tracking).
- FR-STF-3 Wallet tab: balance, KHQR QR upload, withdrawal request (decrements wallet, refundable on reject).
- FR-STF-4 Availability slots; time-off requests; performance stats; job history.
- FR-STF-5 Chat with customers; AI assistant screen.

### 3.5 Admin (Web `/admin` + Expo `(admin)` read-mostly)
- FR-ADM-1 Dashboard: platform KPIs w/ growth, action queue, recent registrations.
- FR-ADM-2 Company lifecycle: list → pending queue → verify/accept/reject (with reason) → suspend → expire trial.
- FR-ADM-3 User management: search/filter, suspend/activate, delete, full 360° user detail (bookings as customer, owned companies, staff memberships, audit trail).
- FR-ADM-4 Payouts: unified ledger of company+staff payouts; process (marks completed, sets processedAt, optional transaction ref). Reject refunds.
- FR-ADM-5 Transactions browser + payment detail w/ refund action.
- FR-ADM-6 Disputes: list/detail, resolve with notes; moderation queue; compliance reports.
- FR-ADM-7 Catalog governance: categories, service types, promo codes, pricing rules.
- FR-ADM-8 Comms: email templates, broadcasts (push), support tickets (reply/update status).
- FR-ADM-9 Audit logs (immutable trail, bulk delete restricted), global settings, monitoring page.
- FR-ADM-10 Reviews oversight.

### 3.6 Cross-role real-time
- FR-RT-1 Chat (conversation rooms, typing, read receipts).
- FR-RT-2 Booking rooms: status changes pushed to participants.
- FR-RT-3 Presence (online/offline/last-seen via Redis).
- FR-RT-4 Instant request rooms (new bids pushed live).

---

## 4. Page map — Web dashboard (`frontend`)

Auth guard chain: edge middleware verifies JWT → `ProtectedRoute` re-checks role → role-scoped layouts.

### `/auth/*`
| Page | Purpose |
|---|---|
| login | Email/password + social buttons |
| register | Sign-up |
| forgot-password / reset-password | OTP-based reset with resend cooldown |
| verify-email | Email verification landing |

### `/admin/*` — guarded `allowedRoles=['admin']`, shared shell (AppSidebar/AppTopBar/Ctrl-K palette/AIAssistant)

**Overview**
| Page | Purpose |
|---|---|
| dashboard | KPIs, growth chart, action queue, recent companies, health, activity, reports |
| analytics | Deep-dive metrics & charts |
| reports | P&L, cashflow, payout ledger, tax, CSV/PDF exports |

**Marketplace management**
| Page | Purpose |
|---|---|
| companies · companies/[id] · companies/pending | Company CRUD, 360° detail, verification queue (accept/reject/verify) |
| users · users/[id] | Directory w/ bulk suspend/delete; user 360° (customer+owner+staff lenses) |
| staff | Platform-wide staff directory |
| bookings · bookings/[id] | Booking queue + manage drawer/status |
| support | Ticket desk |

**Catalog**
categories · service-types · promotions

**Platform ops / Finance**
| Page | Purpose |
|---|---|
| disputes · disputes/[id] | Resolve disputes |
| payouts | Unified payout ledger; Process (bulk + per-row); KHQR viewer dialog; simulate-payment |
| transactions · transactions/[id] | Ledger browser; payment detail + refund |
| verification | Dedicated verify/reject console w/ daily counters |
| audit | Audit log grid, CSV export, bulk delete |
| moderation · compliance | Content reports; compliance reports |

**System & comms**
messages · emails (templates) · broadcasts (push) · settings · reviews

### `/company/*` — guarded `['company_admin','admin']`

**Overview:** dashboard (KPIs, revenue chart, staff online, activity) · analytics · notifications · messages
**Operations:** bookings (+[id], calendar) · dispatch · staff (+[id]) · schedule
**Business:** customers (CRM) · services · reviews · areas (service coverage)
**Finance:** revenue · payouts · transactions · wallet (balance, withdrawal request w/ bank details, history)
**System:** settings (profile, bank, booking mode) · pricing · marketing · reports · support · disputes (+[id])

---

## 5. Page map — Expo app (`frontend-expo`)

Route groups are role-scoped; each root layout mounts its guard + sidebar.

### `(public)`
welcome → login / register → forgot-password → reset-password → verify-email · legal/terms · legal/privacy

### `(customer)` — bottom tabs: home, explore, activity, message, profile
| Flow | Screens |
|---|---|
| Discover | tabs/home · tabs/explore · search/index · map-view · category/[id] |
| Detail | service/[id] · company/[id] |
| Book | checkout → booking/[id] · booking/cancel · reschedule · failed · messages |
| Instant request | instant-request/index → matching → selection → confirmation → tracking |
| Addresses | address/index · new · [id] |
| Social | messages/index · new · [id] · notifications · saved/index · reviews/index · new |
| Account | profile tab · settings · edit-profile · change-password · complete-profile |

### `(company)` — tabs: dashboard, operations, staff, messages, more
payouts/request · payouts/history · payouts/bank-account · payments · subscription
services · services/new · staff/new · staff/[id] (approve/reject payouts, availability, chat)
booking/[id] · analytics · reviews · customers · coverage · marketing · available-jobs
edit-profile · change-password · settings · support

### `(staff)` — tabs: today, money, me
job/[id]: index · update-status · execution (photo proof) · track-map · complete
payout (withdraw + KHQR QR upload) · performance · availability · timeoff · history
profile · edit-profile · settings · change-password · measurement · ai/ai · chat/[userId]

### `(admin)` (mobile companion) — tabs: dashboard, queue, users, companies, analytics, settings
audit · broadcasts · categories · company/[id] · compliance · disputes · help · messages
moderation · monitoring · payouts · promotions · refunds · service-types · support · users/[id]
settings/profile · settings/password

### Shared
notifications · legal screens

---

## 6. End-to-end money & job flows (verified against code)

### Flow A — Customer books a service
1. Customer picks service → picks slot → address → promo → checkout.
2. Payment recorded (`Payment`), booking created (`pending`), status log entry.
3. Company sees it in queue (web Booking Queue / expo Operations) → accepts (`confirmed`) → assigns staff.
4. Staff (expo Today) drives pipeline `accepted → en_route → in_progress → completed`; en_route streams GPS to customer's tracking screen.
5. Completion credits: platform fee split → `Transaction` rows credit company availableBalance (+ staff wallet if assigned).
6. Customer reviews (optional); dispute window opens.

### Flow B — Company withdraws earnings (Expo OR Web wallet)
1. Company requests amount ≤ availableBalance → `Payout(pending, type=company)` + immediate ledger debit (funds leave availableBalance at request time).
2. Row appears in Admin → Payouts (status `processing` chip).
3. Admin opens KHQR dialog (company's uploaded QR), pays externally, clicks Process → status `completed`, processedAt stamped, optional tx reference.
4. If rejected instead → admin reject path marks failed and the financials flow refunds via compensating credit transaction.

### Flow C — Staff withdraws wages (Expo only)
1. Staff taps Withdraw on payout screen (amount = full balance) → `POST /staff/payouts/request`.
2. Backend decrements `companyStaff.walletBalance` + writes `WalletTransaction(debit)` inside one transaction; payout row now also stamped with companyId (Aug 2026 fix).
3. Company sees it in Payout History (and on staff detail) → Approve (mark completed) or Reject.
4. Reject atomically: payout → `failed`, wallet re-credited, credit wallet-transaction logged.
5. Admin can also process any staff payout from the unified ledger.

### Flow D — Instant request
1. Customer posts request (service, location, time) → matched nearby companies notified.
2. Companies submit bids (price, ETA) — demo mode auto-generates up to 3 staggered bids.
3. Customer watches bids arrive live (instant-request room), selects one → becomes booking-style job.

### Flow E — Verification gate
1. New company registers → `verificationStatus=pending` → appears in admin pending queue + Verification console (daily counters).
2. Admin Accept/Reject(reason) → company gains premium routes (analytics, payments, coverage unlock in Expo sidebar guard).

### Flow F — Support & disputes
Customer/staff/company raise tickets (`POST /support/tickets`) → admin desk replies/statuses. Payment/booking disagreements escalate to Disputes → admin resolves with notes.

---

## 7. API surface summary (262 endpoints, 31 modules)

Largest modules: companies (42) · admin (30) · payouts (17) · auth (16) · bookings (16) · users (15) · wallets (14) · payments (13) — plus reviews, services, staff, service-types, notifications, addresses, categories, conversations, disputes, promo-codes, financials, instant-requests, pricing-rules, saved-items, support, audit-logs, compliance, moderation, settings, location, webhooks (ABA/Wing fail-closed signature checks), upload, health.

Real-time gateways: chat (typing/read), bookings (status + staff_location_update), location, instant-requests, presence, admin-dashboard room.

Database: 48 models — identity (User, RefreshToken, OtpCode, PasswordReset), marketplace (Company, CompanyStaff, Service, Category, ServiceType, ServiceArea, AvailabilitySlot), commerce (Booking, BookingStatusLog, Payment, Invoice, PromoCode, PricingRule, Cancellation, InstantRequest/Bid), money (WalletTransaction, Transaction, DepositRequest, PayoutRequest, Payout, CompanyPaymentMethod, StaffPaymentMethod), trust (Review, CompanyRatingSummary, Dispute, ModerationLog, ComplianceReport), comms (Conversation*, Message, Notification, Broadcast, SupportTicket*), governance (AuditLog, SystemSetting, StaffDocument, StaffNote, MarketingCampaign, SavedItem, UserAddress, EmailTemplate).

---

## 8. Known gaps / honest caveats (pre-launch)

1. **i18n**: web dashboards are English-only (next-intl installed, unused); Expo covers Khmer/EN partially outside core screens.
2. **Admin notifications page** doesn't exist on web; bell routes to Broadcasts.
3. **Platform Health widget** is static ("Healthy" placeholders) until a /health-per-service endpoint exists.
4. **Instant-request demo bids** auto-generate mock competitors when no companies match — disable before real launch.
5. Backend has **8 high CVEs** (axios-via-bakong-khqr chain, uuid-via-firebase-admin) — awaiting upstream releases; `npm audit fix` blocked by peer conflicts.
6. Firebase service-account key was committed historically — untracked now but **the key must still be rotated** in Firebase console and history scrubbed.
7. 27 commits ahead of origin — **push + tag a release** before deploying.

---

## 9. Where the older docs fit

`docs/01…22_*.md` remain valid for product rationale, UX bible per role, DB diagrams, and the API master map. This document reflects the codebase **as built today**, including the August 2026 hardening pass (auth cookie migration, payout-flow fixes, security blockers resolved).
