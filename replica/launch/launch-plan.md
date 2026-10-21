# ServiceFinder Launch & Distribution Playbook

**Phase**: Go-To-Market Execution  
**Lead Positioning**: The Verified Fleet Network with Escrow Protection  
**Date**: 2026-10-12  

---

## 1. Pre-Launch Gate & Readiness Verification

- [x] Full feature parity score at **100.0 / 100** (`parity.py` validated).
- [x] 0 open S1 (Critical Security) and 0 open S2 (Blocking Functionality) defects.
- [x] Both backend and frontend compile with 0 TypeScript errors (`npx tsc --noEmit`).
- [x] Rebrand sweep passing with 0 incumbent trademarks or colors (`sweep.py` validated).
- [x] App Store & Google Play metadata passing linter with 0 errors and 0 warnings (`listing.py` validated).
- [x] Offline-first execution queue (`staffOfflineQueue.ts`) and Instant Broadcast Bidding connected end-to-end.

---

## 2. Target Channels: Where Competitors' Unhappy Users Congregate

From our review research in [`replica/feedback.md`](file:///d:/FOR%20RENDO%20%28ONLY%20%29/Personal%20Project/Service_Finder/replica/feedback.md), unhappy customers and burned contractors gather in specific online communities:

1. **Reddit Communities**:
   - `r/TaskRabbit`: Both clients complaining about 30%+ surprise fees and Taskers complaining about sudden metrics demotions and cancellation penalties.
   - `r/Thumbtack`: Hundreds of active service professionals expressing outrage over $40–$100 pay-per-lead charges for ghost leads and dead instant bookings.
   - `r/sweatystartup` & `r/smallbusiness`: Independent HVAC, electrical, plumbing, and cleaning operators looking for field management software that doesn't extort them for leads.
   - `r/HomeImprovement`: Homeowners sharing horror stories of contractor no-shows and contractor rate-switching.

2. **Contractor Facebook & Trade Groups**:
   - "Taskers Nationwide", "Handyman Business Owners", "Independent Cleaners & Housekeepers Network".

---

## 3. Launch Posts & Distribution Copy

### Hacker News "Show HN" Pitch
```text
Show HN: ServiceFinder – On-demand service platform with fleet dispatch, escrow, and $0 lead fees

Hi HN,

We built ServiceFinder because the gig economy for home services has broken down:
1. Solo contractors frequently cancel hours before critical jobs with zero backup dispatch.
2. Incumbents silently mark up rates by 30-40% at checkout or charge pros $50-$100 for dead leads even when their calendars are blocked off.
3. Tradespeople working in basements or rural sites lose notes and sign-offs when cell signal drops.

ServiceFinder changes this:
- We dispatch established multi-technician companies with live GPS turn-by-turn tracking. If a technician is delayed, the company reassigns the nearest unit.
- Funds are locked in two-phase escrow and only released upon before/after photo proof and customer signature.
- Contractors pay $0 for leads or quotes—we only earn a 10% commission on completed, signed-off jobs.
- Built offline-first so workers in zero-signal crawlspaces never lose progress photos or timestamps.

Stack: Next.js 14, Expo SDK 52 (React Native), NestJS, PostgreSQL, Prisma, WebSockets.

Live demo: https://servicefinder.app
We'd love your feedback on our dispatch state machine and escrow mediation architecture.
```

### Product Hunt Launch Pitch
- **Tagline**: Verified service fleet dispatch with live GPS and escrow protection.
- **Problem**: Solitary gig workers flake, platforms charge hidden 35% checkout fees, and contractors bleed money on dead leads.
- **Solution**: Multi-technician company rosters, turn-by-turn GPS tracking, mandatory milestone photos, and funds locked in CrewLock escrow until customer sign-off. $0 upfront fees for pros.

---

## 4. The First 10 Hand-Picked Onboarding Targets

To achieve high-quality marketplace liquidity in the initial pilot market:
1. **Target 5 Local Trade Companies** (2 HVAC/Electrical, 2 Plumbing, 1 Multi-Crew Cleaning):
   - Value prop: Free dispatch software + zero upfront lead fees. Only pay when jobs complete.
   - White-glove onboarding: Import their technician rosters, set their service radii, and install the Expo mobile app on their field technicians' phones.
2. **Target 5 Commercial / Residential Property Managers**:
   - Value prop: Guaranteed dispatch with live turn-by-turn tracking, milestone photos on every invoice, and centralized escrow accounting.
