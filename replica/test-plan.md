# Test Plan: ServiceFinder

**Build**: Current Working Branch (`012-staff-experience-alignment`)  
**Date**: 2026-10-12  
**Env**: Local dev servers (Next.js :3000, NestJS :3001, Expo SDK 52 :8081), Seed database

| Case | Flow | Type | Steps | Expected | Auto | Result |
|---|---|---|---|---|---|---|
| F01-H1 | F01 Customer Booking | Happy Path | Explore category -> Select provider -> Choose package -> Checkout with address -> Pay | Booking confirmed with `pending` status, escrow transaction logged, company alerted | e2e / manual | PASS |
| F01-E1 | F01 Customer Booking | Edge: Address outside bounds | Select provider -> Enter address 50km outside coverage radius | Warning banner "Out of service area", checkout CTA disabled | e2e | PASS |
| F01-E2 | F01 Customer Booking | Edge: Expired promo code | Apply promo code past validity date | Invalid promo alert, discount resets to $0.00, subtotal preserved | e2e | PASS |
| F01-N1 | F01 Customer Booking | Negative: Declined card | Submit checkout with invalid/declined payment card | Payment failure banner, booking remains uncreated, escrow not deducted | e2e | PASS |
| F02-H1 | F02 Company Dispatch | Happy Path | Open Dispatch Board -> Click unassigned booking -> Select technician -> Confirm | Booking assigned, technician receives push alert, appears in staff live dispatch | e2e | PASS |
| F02-E1 | F02 Company Dispatch | Edge: Staff already on job | Assign technician currently marked `WORKING` | Visual badge indicates technician busy, confirmation prompt requires override | e2e | PASS |
| F02-N1 | F02 Company Dispatch | Negative: Off-duty staff | Attempt dispatch to technician with off-duty availability slot | Staff member filtered out of instant assign list | e2e | PASS |
| F03-H1 | F03 Staff Field Execution | Happy Path | Tap "Start Traveling" -> "Arrived" -> Take before photos -> "Work Complete" -> Take after photos -> Customer signature -> Finish | Job state machine advances sequentially to `COMPLETED`, photos saved, signature receipt generated | manual | PASS |
| F03-E1 | F03 Staff Field Execution | Edge: Cellular offline mode | Perform status advance and take photo while offline | Buffered in `staffOfflineQueue.ts`, notification queued, auto-synced upon reconnect | unit / manual | PASS |
| F03-N1 | F03 Staff Field Execution | Negative: Finish without photos | Attempt finish before mandatory proof photos | Alert "Photo documentation required before job completion" | manual | PASS |
| F04-H1 | F04 Escrow & Payouts | Happy Path | Job marked completed -> Escrow hold released -> Platform fee calculated -> Company requests withdrawal | Wallet balance increases by net earnings, payout request moves to admin queue | e2e | PASS |
| F04-E1 | F04 Escrow & Payouts | Edge: Dispute filed in lock period | Customer files dispute within 24h completion window | Escrow payout frozen, dispute dossier opened, admin mediation alerted | e2e | PASS |
| F04-N1 | F04 Escrow & Payouts | Negative: Exceed wallet balance | Request payout amount greater than available liquid wallet balance | Form validation error: "Amount exceeds available balance" | e2e | PASS |
| F05-H1 | F05 Dispute Arbitration | Happy Path | Admin reviews claims in Dispute Resolution Sheet -> Issues 50/50 compromise refund | Escrow funds split automatically, customer wallet refunded 50%, company credited 50% | manual | PASS |
| F05-N1 | F05 Dispute Arbitration | Negative: Unauthenticated access | Attempt to access dispute arbitration desk as standard customer | HTTP 403 Forbidden, redirected to public login | e2e | PASS |
