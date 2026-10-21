# ServiceFinder Pricing Architecture & Economic Model

**Positioning Focus**: 100% Upfront Transparent Breakdown & Zero Pay-Per-Lead Fees  
**Target Incumbents**: TaskRabbit, Thumbtack, Angi  
**Date**: 2026-10-12  

---

## 1. Incumbent Pricing Comparison

| Platform | Customer Cost Model | Provider (Pro) Cost Model | Fee Transparency | Date Read |
|---|---|---|:---:|:---:|
| **TaskRabbit** | Pro hourly rate + **15%–35% service fee** added at checkout | Kept free to bid, but hourly rate is marked up without contractor knowledge | **Opaque**: Service fee hidden until final invoice | 2026-10 |
| **Thumbtack** | Pro quote price | **$40–$100+ per lead** (charged when client messages, regardless of hiring) | **High Pro Risk**: Pros charged for dead or unresponsive leads | 2026-10 |
| **Angi / Handy** | Fixed pricing or quote | Annual subscription lock-in + 20-35% platform fee | **Rigid**: Difficult cancellations and high clawback risk | 2026-10 |
| **ServiceFinder (Us)** | **100% upfront quote** with itemized base + platform fee | **$0 upfront lead fees**; 10% platform commission deducted only upon job sign-off | **100% Transparent**: Itemized upfront on 1 screen | 2026-10 |

---

## 2. Evidence from Review Research

From [`replica/feedback.md`](file:///d:/FOR%20RENDO%20%28ONLY%20%29/Personal%20Project/Service_Finder/replica/feedback.md):
- **26 reviews** criticized hidden checkout fees and unfair cancellation penalties (Average rating: 1.3★).
- **12 reviews** criticized pay-per-lead charges where contractors lose hundreds of dollars on dead leads (Average rating: 1.7★).
- **9 reviews** criticized astronomical rate jumps and rate-switching at the customer's front door (Average rating: 2.7★).

---

## 3. The ServiceFinder Economic Model

### For Customers (Homeowners & Business Facilities)
- **Zero Surprises**: The price shown on the booking screen is the exact total billed to the card.
- **CrewLock Escrow Security**: 100% of the funds are locked in escrow until the customer signs off on the digital receipt and verifies milestone photos.
- **Transparent Refund Policy**: Free cancellations up to 2 hours before scheduled technician arrival. If a technician is tardy or drops out, instant 100% refund or priority auto-dispatch replacement.

### For Service Providers (Trade Companies & Contractors)
- **$0 Pay-Per-Lead**: Pros never pay a penny to browse jobs, bid on broadcasts, or communicate with clients.
- **Success-Based Commission**: Platform earns a 10% service commission strictly deducted from the escrow payout upon job completion.
- **Liquid Wallet**: Payouts settle into the company wallet immediately upon customer sign-off, with one-click bank transfer.

---

## 4. Platform Subscription Tiers (SaaS Modules for Companies)

For established service companies using ServiceFinder's enterprise cockpit, three transparent tiers are available:

| Tier | Target User | Pricing | Core Capabilities |
|---|---|:---:|---|
| **Starter Fleet** | Independent contractors (1-2 technicians) | **Free** ($0 / month) + 10% job commission | Unlimited job bidding, mobile dispatch app, turn-by-turn GPS tracking, CrewLock escrow, offline sync |
| **Pro Dispatch** | Growing service businesses (3-10 technicians) | **$49 / month** (billed annually) or $59/mo + 8% job commission | Live operations dispatch board, automated crew route assignment, team availability projections, cash reconciliation limits, priority broadcast feed |
| **Enterprise Fleet** | Commercial fleets & multi-branch operators (10+ technicians) | **$149 / month** (billed annually) or $179/mo + 6% job commission | Multi-branch routing, custom commission rules, dispute arbitration dossier with mediation splits, dedicated SLA manager, custom API webhooks |

---

## 5. Stripe Products & SKU Configuration

For Stripe Billing integration:
1. `prod_sf_pro_dispatch`:
   - Monthly SKU: `price_sf_pro_monthly` ($59.00 USD / month)
   - Annual SKU: `price_sf_pro_annual` ($588.00 USD / year — equivalent to $49/mo, 2 months free)
2. `prod_sf_enterprise_fleet`:
   - Monthly SKU: `price_sf_ent_monthly` ($179.00 USD / month)
   - Annual SKU: `price_sf_ent_annual` ($1,788.00 USD / year — equivalent to $149/mo, 2 months free)
3. `prod_sf_escrow_hold`:
   - Standard Stripe PaymentIntent with `capture_method: manual` (funds authorized and held in escrow, captured upon job completion).
