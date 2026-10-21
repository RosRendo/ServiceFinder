# Recon Map: ServiceFinder (Web & Mobile Multi-Tenant Ecosystem)

**Scope**: Full end-to-end on-demand service ecosystem across 4 user roles: Customer, Service Company, Field Staff/Technician, and Platform Super Admin.  
**Platform**: Web (Next.js 14 App Router) + Mobile (React Native / Expo SDK 52) + Backend API (NestJS + Prisma + PostgreSQL + Socket.io).  
**Date**: 2026-10-12  

---

## 1. Sources

| # | Source | Path / URL | Notes |
|---|--------|-----------|-------|
| 1 | Backend API Architecture | `backend-nest/src/**` | 38 modules, 48 Prisma models, JWT auth, Socket.io gateways |
| 2 | Web Application (Customer, Company, Admin) | `frontend/app/**` | Next.js 14, Tailwind CSS, interactive drawers, command palette |
| 3 | Mobile Application (Customer, Company, Staff, Admin) | `frontend-expo/app/**` | React Native Expo Router v3, corporate cockpit tokens, offline sync |
| 4 | Prisma Schema & Database Transactions | `backend-nest/prisma/schema.prisma` | PostgreSQL relational schema with escrow ledgers and audit logs |

---

## 2. Core Loop

> **The Core Value Loop**: A customer discovers and books a verified local service provider with escrow payment protection; the provider dispatches an on-field technician who navigates via live GPS, executes the job with photographic proof and customer signature sign-off; upon completion, escrow funds are automatically released to the company wallet for payout.

---

## 3. Screen Inventory

### Customer Portal (Web & Mobile)
| ID | Screen | Route / Path | Purpose | Key Components | States Seen |
|---|--------|--------------|---------|----------------|-------------|
| S01 | Landing & Category Explorer | `frontend/app/page.tsx` & `(customer)/(tabs)/home.tsx` | Platform entry, top categories, hero search, featured pros | HeroSearch, CategoryGrid, ProviderCarousel | default, loading, search-active |
| S02 | Interactive Map Discovery | `(customer)/map-view.tsx` & `frontend/components/maps/InteractiveMap.tsx` | Geolocation-based discovery of active providers | InteractiveMap, ProviderCard, RadiusFilter | empty, pin-selected, loading |
| S03 | Company Dossier & Services | `(customer)/company/[id].tsx` & `frontend/app/company/[id]` | Provider portfolio, verified badges, reviews, pricing tiers | CompanyHeader, TierSelector, ReviewList | verified, pending, empty-reviews |
| S04 | Service Detail & Options | `(customer)/service/[id].tsx` | Inspect specific service inclusions, add-ons, and pricing | PackageCard, AddonCheckbox, BookingCTA | default, custom-tier |
| S05 | Checkout & Escrow Booking | `(customer)/checkout.tsx` | Address selection, date/time slot picker, promo code, escrow hold | SlotPicker, AddressModal, PromoInput, EscrowBadge | idle, calculating, submitting, error |
| S06 | Booking Tracking & Timeline | `(customer)/booking/[id].tsx` | Real-time status tracker, technician polyline tracking, cancel/reschedule | StatusStepper, LiveMap, ChatButton, CancelModal | confirmed, traveling, arrived, working, completed |
| S07 | Booking History & Reviews | `(customer)/(tabs)/activity.tsx` & `(customer)/reviews/new.tsx` | Historical jobs, receipt download, star ratings & feedback | JobCard, StarRatingInput, PhotoPicker | empty, paginated, reviewed |
| S08 | Direct Chat & Messaging | `(customer)/(tabs)/message.tsx` & `(customer)/messages/[id].tsx` | Real-time messaging with assigned company / dispatch supervisor | MessageBubble, ChatInput, AttachmentButton | empty, active-chat, offline |

### Field Staff / Technician Portal (Mobile Only)
| ID | Screen | Route / Path | Purpose | Key Components | States Seen |
|---|--------|--------------|---------|----------------|-------------|
| S09 | Live Dispatch Console | `(staff)/(tabs)/today.tsx` | Active shift console, incoming job alerts, state transitions | DispatchCard, StatusStateMachine, MapPreview | waiting, new_job, traveling, arrived, working |
| S10 | Turn-by-Turn GPS Tracking | `(staff)/job/[id]/track-map.tsx` | Live GPS route navigation to customer premises | MapPolyline, ETAIndicator, CustomerCallBtn | routing, arrived-trigger |
| S11 | Milestone Execution & Proof | `(staff)/job/[id]/execution.tsx` | Step checklist, before/after photographic evidence capture | MilestoneChecklist, CameraPicker, UploadQueue | pending-photos, uploaded, buffered-offline |
| S12 | Customer Sign-off & Completion | `(staff)/job/[id]/complete.tsx` | Digital signature capture, final invoice summary, swipe-to-complete | SignaturePad, PriceSummary, SwipeButton | signing, saving, confirmed |
| S13 | Shift Earnings & Velocity | `(staff)/(tabs)/money.tsx` | Shift net earnings, 7-day velocity chart, trip history, cash limit | WhiteHeroCard, WeeklyBarChart, CashReconciliationCard | today-view, week-view, empty-trips |
| S14 | Availability & Weekly Hours | `(staff)/availability/index.tsx` | Weekly on-call schedule and 4-week slot projection | DayToggle, TimeRangePicker, SaveScheduleBtn | default, picking-time, saving |
| S15 | Leave & Time Off Request | `(staff)/timeoff/index.tsx` | Request vacation/sick days, check balance cards | BalanceCard, DateRangePicker, ReasonInput | form-hidden, form-active, submitting |
| S16 | Technician Dossier & Profile | `(staff)/(tabs)/me.tsx` | Profile header, quick setting links, emergency SOS hotline | ProfileDossier, NavRowList, EmergencyModal | active, logged-out |
| S17 | Performance Scorecard | `(staff)/performance/index.tsx` | Average star rating, completion velocity, customer reviews feed | RatingCard, BreakdownBars, ReviewFeed | above-average, room-to-improve |
| S18 | AI Diagnostics Assistant | `(staff)/ai/ai.tsx` | AI-powered technical diagnostic troubleshooter for field repairs | DiagnosticChat, PromptChips, DiagnosticCard | idle, analyzing, resolved |

### Service Company Cockpit (Web & Mobile)
| ID | Screen | Route / Path | Purpose | Key Components | States Seen |
|---|--------|--------------|---------|----------------|-------------|
| S19 | Executive Operations Dashboard | `frontend/app/company/dashboard` & `(company)/(tabs)/dashboard.tsx` | Live KPI counters, dispatch queue, revenue trends | MetricCard, DispatchAlertBanner, ActivityFeed | active, trial, suspended |
| S20 | Real-time Dispatch Board | `frontend/app/company/dispatch` & `(company)/(tabs)/operations.tsx` | Assign bookings to technicians, live availability check | DispatchDataGrid, AssignStaffModal, MapCluster | unassigned, assigned, in-progress |
| S21 | Staff Roster & Invitations | `frontend/app/company/staff` & `(company)/(tabs)/staff.tsx` | Add technicians, configure roles, view on-field status | StaffTable, InviteStaffDrawer, WorkingStatusDot | active, on-shift, invited |
| S22 | Services Catalog & Pricing | `frontend/app/company/services` & `(company)/services.tsx` | Create/edit service offerings, tier packages, duration | ServiceTable, ServiceDrawer, TierEditor | empty, active-catalog |
| S23 | Escrow Disputes & Mediation | `frontend/app/company/disputes` & `(company)/disputes/index.tsx` | Manage dispute filings, submit counter-evidence, chat with admin | DisputeTable, DisputeTimeline, CounterEvidenceUploader | open, under_review, resolved |
| S24 | Financial Ledger & Payouts | `frontend/app/company/payouts` & `(company)/(tabs)/finance.tsx` | Wallet balance, bank accounts, request disbursement | WalletCard, PayoutHistory, BankAccountModal | eligible, pending-payout, paid |

### Platform Super Admin Cockpit (Web & Mobile)
| ID | Screen | Route / Path | Purpose | Key Components | States Seen |
|---|--------|--------------|---------|----------------|-------------|
| S25 | Platform Command Center | `frontend/app/admin/dashboard` & `(admin)/(tabs)/dashboard.tsx` | Global GMV, escrow volume, active providers, system health | ExecutiveMetricRibbon, AlertMatrix, QuickActions | live-telemetry |
| S26 | Global Bookings Directory | `frontend/app/admin/bookings` & `(admin)/bookings/index.tsx` | Comprehensive audit search across all platform bookings | ManagementDataGrid, FilterChips, BookingStatusPill | paginated, filtered |
| S27 | Booking Inspection Dossier | `frontend/app/admin/bookings/[id]` & `(admin)/bookings/[id].tsx` | Inspect full booking timeline, escrow payment, photo evidence | TimelineStepper, EvidenceViewer, StatusLog | active, disputed, refunded |
| S28 | Company Verification Desk | `frontend/app/admin/verification` & `(admin)/companies/pending` | Review registration documents, license check, approve/reject | CredentialInspectionCard, ApproveBtn, RejectModal | pending, verified, rejected |
| S29 | Escrow Dispute Arbitration | `frontend/app/admin/disputes` & `(admin)/disputes/index.tsx` | Neutral arbitration, review customer & company claims, split escrow | DisputeResolutionSheet, EvidenceSplitter, PayoutAction | pending-action, arbitrated |
| S30 | Commission Rules & Pricing | `frontend/app/admin/settings` & `(admin)/commission-rules` | Platform rake rules, fixed vs percentage platform fees | CommissionRuleDrawer, TierThresholdTable | active-rules |
| S31 | User & Staff RBAC Admin | `frontend/app/admin/users` & `(admin)/users/index.tsx` | User directory, role promotion, account suspension, audit logs | UserTable, UserDrawer, RoleDropdown | active, suspended, flagged |

---

## 4. User Flows

### F01: Customer Instant / Scheduled Booking
```text
S01 (Explore/Search) -> S03 (Select Provider) -> S04 (Pick Package & Addons) -> S05 (Checkout & Escrow Hold) -> S06 (Confirmed Tracking)
Happy path clicks: 4
Edge cases: No slots available, card payment failure, address out of service area bounds, promo code expired.
```

### F02: Company Dispatch & Technician Assignment
```text
S19 (Dispatch Alert) -> S20 (Open Dispatch Board) -> S20 (Select Booking -> Open AssignStaffModal) -> Select Available Technician -> Dispatch Confirmed
Happy path clicks: 3
Edge cases: Technician currently on another job, technician outside operational radius, booking cancelled before dispatch.
```

### F03: Field Technician On-Site Job Execution
```text
S09 (Accept Incoming Dispatch) -> State: TRAVELING -> S10 (GPS Navigation) -> State: ARRIVED -> S11 (Take Before Photos) -> State: WORKING -> S11 (Take After Photos) -> S12 (Customer Signature Sign-off) -> State: COMPLETED
Happy path clicks: 6
Edge cases: No cellular connectivity (handled via staffOfflineQueue.ts), customer unavailable at premises, unexpected scope expansion.
```

### F04: Escrow Resolution & Financial Settlement
```text
Job Completed -> Backend Webhook / Transaction -> Escrow Release -> Platform Commission Deducted -> Company Wallet Credited -> S24 (Company Payout Request) -> S25 (Admin Automated / Manual Disbursement)
Happy path clicks: Automated on completion; 2 clicks for company withdrawal.
Edge cases: Customer files dispute within 24h escrow lock window, bank account validation failure.
```

### F05: Escrow Dispute Arbitration Flow
```text
Customer or Company flags issue -> S23 (Company Evidence Submission) -> S29 (Admin Dispute Arbitration Desk) -> Neutral Mediation Thread -> Admin Issues Partial / Full Refund -> Escrow Split Executed
Happy path clicks: 4
Edge cases: Counter-evidence missing, chargeback initiated via card issuer.
```

---

## 5. Components & Design System

- **Tokens**: Corporate Cockpit Unified Palette:
  - Surface: Pure White `#FFFFFF`
  - Background: Crisp Slate `#F8FAFC`
  - Borders: Hairline Slate `#E2E8F0`
  - Primary Typography: Deep Charcoal `#0F172A`
  - Secondary Typography: Slate `#64748B` / `#94A3B8`
  - Semantic Indicators: Emerald `#059669` (Active/Completed), Amber `#D97706` (Pending/Review), Red `#DC2626` (Failed/Dispute), Blue `#0284C7` (Info/En-route)
- **Key Reusable Modules**:
  - `ExecutiveMetricRibbon.tsx`: High-density executive KPI stats
  - `ManagementDataGrid.tsx`: Sortable, filterable enterprise table
  - `DisputeResolutionSheet.tsx`: Escrow split calculator and settlement executor
  - `CredentialInspectionCard.tsx`: Document previewer with verification toggles
  - `CashReconciliationCard.tsx`: On-site cash risk monitoring
  - `VisualMilestoneStepper.tsx`: Field progress checklist
  - `StaffSidebar.tsx` & `CompanySidebar.tsx` & `AdminSidebar.tsx`: Normalized drawer navigations

---

## 6. Active Data Model (Prisma ORM)

48 relational entities in PostgreSQL:
- **Core Identities**: `User`, `Company`, `CompanyStaff`, `UserAddress`, `RefreshToken`, `PasswordReset`, `OtpCode`
- **Catalog & Geography**: `Category`, `ServiceType`, `Service`, `ServiceArea`, `AvailabilitySlot`
- **Booking & Lifecycle**: `Booking`, `BookingStatusLog`, `Cancellation`, `Review`, `CompanyRatingSummary`
- **Payments & Ledgers**: `Payment`, `Invoice`, `WalletTransaction`, `Transaction`, `Payout`, `DepositRequest`, `PayoutRequest`, `CompanyPaymentMethod`, `StaffPaymentMethod`, `PricingRule`, `PromoCode`
- **Field & Evidence**: `StaffDocument`, `StaffNote`, `InstantRequest`, `InstantRequestBid`
- **Governance & Messaging**: `Dispute`, `Conversation`, `ConversationParticipant`, `Message`, `Notification`, `SupportTicket`, `SupportTicketMessage`, `AuditLog`, `ModerationLog`, `ComplianceReport`, `Broadcast`, `SystemSetting`, `EmailTemplate`

---

## 7. Feature Matrix Summary

- **Total Features Analyzed**: 50
- **Must-Have Features**: 38 (38 of 38 completed — **100%**)
- **Should-Have Features**: 9 (8 completed, 1 partial: Instant Request broadcast bidding)
- **Could-Have Features**: 1 (AI field diagnostics — completed)
- **Out of Scope (Skipped)**: 2 (Third-party developer app store, third-party background check paid API)

---

## 8. Size & Complexity

- **Screens**: 53 unique screens across Web and Mobile
- **User Flows**: 5 core operational end-to-end flows
- **Database Entities**: 48 active tables with foreign key cascades
- **Hard Technical Problems Solved**:
  1. Offline photo & state queue buffering (`staffOfflineQueue.ts`) with NetInfo auto-reconnect flush
  2. Live GPS route calculation and map marker coordinate broadcast
  3. Two-phase escrow lock & release with automated platform commission calculation
  4. Role-based navigation guards and multi-tenant authorization
- **Platform Size Assessment**: **L** (Full-scale production-ready multi-tenant on-demand marketplace)
