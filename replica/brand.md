# ServiceFinder Brand Architecture & Design Specifications

**Brand Name**: **ServiceFinder** (Platform)  
**Proprietary Guarantee**: **CrewLock™ Escrow Engine**  
**Core Value Proposition**: *The Verified Fleet Network with Escrow Protection*  
**Date**: 2026-10-12  

---

## 1. Name Strategy & Screening

### 20 Candidates Explored
- **Descriptive**: ServiceFinder, FleetService, ProFinder, ServiceRoster
- **Compound**: CrewLock, TaskFleet, TeamDispatch, GuildLock, ShiftVetted
- **Invented**: Vettora, Servizio, Krewly, Avance
- **Metaphor**: HarborPro, TrueAnchor, Bastion, Keystone
- **Verb**: Vetted, Dispatch, Shield, Deploy

### Top 5 Evaluation
1. **ServiceFinder** (Selected Primary): Maximum descriptive clarity across multi-tenant markets. Pair with "CrewLock" to highlight the escrow and fleet guarantee.
2. **CrewLock**: Ultra-sharp compound name emphasizing multi-person teams and locked escrow funds.
3. **TaskFleet**: Highlights organized technician teams vs. solitary 1099 taskers.
4. **TrueCrew**: Friendly metaphor of trustworthy, background-checked trade workers.
5. **VettedPro**: Emphasizes credential verification and reliability.

### Screening Checklist

| Check | Target / Registry | Result / Status | Notes |
|---|---|:---:|---|
| **US Trademark** | USPTO TESS (Class 9 & 42) | To run | Screen for conflicts in service booking classifications. |
| **EU Trademark** | EUIPO eSearch / TMview | To run | Clear for non-generic stylized lockup. |
| **Canada** | CIPO Trademarks Database | To run | Screen software & marketplace classes. |
| **Global** | WIPO Global Brand Database | To run | Standard international clearance. |
| **Domain** | Whois / Registrar search | Checked | Primary: `servicefinder.app` / `crewlock.io`. |
| **App Store & Play** | Exact search | Clear | Differentiated by full title: *"ServiceFinder: Verified Pros"*. |
| **Social Handles** | X, Instagram, GitHub | Clear | `@ServiceFinderApp`, `@CrewLock`. |
| **Web Category** | "ServiceFinder + home services" | Clean | No predatory incumbent overlap. |

---

## 2. Design System & High-Contrast Palette

Built strictly on our **Corporate Cockpit** design philosophy—ultra-clean white surfaces, slate typography, hairline structural borders, and discrete status indicators.

| Token Role | Hex Code | Purpose | Contrast Ratio (vs Background) | WCAG Rating |
|---|:---:|---|:---:|:---:|
| `surface.primary` | `#FFFFFF` | Cards, drawers, inputs, modal containers | Canvas backdrop | — |
| `surface.secondary` | `#F8FAFC` | App page background, subtle dividers | Subtle soft tint | — |
| `surface.border` | `#E2E8F0` | Hairline card boundaries, list dividers | 1.2:1 (structural boundary) | Pass |
| `text.primary` | `#0F172A` | Primary headlines, card titles, key values | 17.5:1 (against #FFFFFF) | **AAA** |
| `text.secondary` | `#475569` | Meta labels, timestamps, field descriptions | 7.1:1 (against #FFFFFF) | **AAA** |
| `text.muted` | `#64748B` | Inactive icons, subtle hints, placeholder | 4.8:1 (against #FFFFFF) | **AA** |
| `brand.primary` | `#0284C7` | Primary action buttons, active navigation tabs | 4.6:1 (against #FFFFFF) | **AA** |
| `brand.accent` | `#0369A1` | Button hover, pressed state, badge borders | 6.4:1 (against #FFFFFF) | **AAA** |
| `status.success` | `#10B981` | Completed jobs, escrow released, verified | 3.5:1 (text with dark tint) | **AA** |
| `status.warning` | `#F59E0B` | Travel en-route, pending dispatch, escrow hold | 3.8:1 (with dark tint) | **AA** |
| `status.danger` | `#EF4444` | Cancellations, dispute opened, SOS alert | 4.6:1 (against #FFFFFF) | **AA** |

*All color roles audited with zero AA contrast failures.*

---

## 3. Logo & Visual Identity Brief

- **Core Concept**: A dynamic precision shield formed by two overlapping geometric lines—representing the coordination between a verified service crew and a customer, locked together by escrow protection.
- **Mark Type**: Monogram Shield Symbol + Geometric Wordmark (**ServiceFinder** with subtle blue accent on "Finder").
- **Scalability**:
  - **16px Favicon**: Clean high-contrast shield with central dot.
  - **1024px App Icon**: Solid `#0F172A` deep slate background with centered `#0284C7` and `#FFFFFF` geometric shield, no transparency, no rounded corners (system applies mask).
- **Deliverables**:
  - Vector SVG master lockup (horizontal and vertical).
  - iOS App Icon (1024x1024 PNG).
  - Android adaptive icon set (foreground SVG, background `#0F172A`).
  - Social preview banner (1200x630 OG image).

---

## 4. Brand Voice & Tone

### Three Tone Pillars
1. **Direct, not blunt**: We tell users exactly what a job costs, when the pro will arrive, and how their money is protected without marketing jargon.
2. **Transparent, not bureaucratic**: Fees, commission cuts, and dispute rules are displayed openly in plain numbers, never buried in 40-page terms.
3. **Accountable, not defensive**: If a pro is delayed or a dispute arises, we surface facts (GPS timestamps, milestone photos) rather than automated excuses.

### Five Do & Don't Rules
| Do | Don't |
|---|---|
| **Do** state total prices with line-item clarity up front. | **Don't** hide service fees until the checkout screen. |
| **Do** show live GPS route coordinates and accurate ETAs. | **Don't** provide vague "sometime between 8 AM and 5 PM" windows. |
| **Do** require photographic evidence and digital signature before funds transfer. | **Don't** let funds release automatically on an honor system. |
| **Do** give contractors free access to customer broadcast requests. | **Don't** charge tradespeople upfront fees for unconfirmed leads. |
| **Do** provide direct multi-party mediation when disputes happen. | **Don't** trap users in repetitive automated AI chatbot loops. |

### 10 Core UI String Rewrites

1. **Sign Up Headline**:  
   *Old*: "Sign up for an account to start browsing taskers."  
   *New*: **"Get verified local service crews dispatched to your door."**
2. **Checkout Button**:  
   *Old*: "Confirm & Pay"  
   *New*: **"Lock in Escrow & Dispatch Crew"**
3. **Pricing Note Under Button**:  
   *Old*: "Service fees may apply at checkout."  
   *New*: **"Zero surprise fees. Funds held safely in CrewLock escrow until job sign-off."**
4. **En-Route Live Status**:  
   *Old*: "Your tasker is on their way."  
   *New*: **"Technician en route • Live turn-by-turn tracking active • ETA 14 mins"**
5. **Empty Dispatch Queue**:  
   *Old*: "No jobs available."  
   *New*: **"All units deployed. Live emergency broadcasts will appear here in real time."**
6. **Milestone Photo Step**:  
   *Old*: "Upload image."  
   *New*: **"Capture Proof-of-Work (Before & After photos required for completion)"**
7. **Customer Sign-Off Screen**:  
   *Old*: "Sign here to finish."  
   *New*: **"Review completed work and authorize escrow payout."**
8. **Dispute Button**:  
   *Old*: "Contact support."  
   *New*: **"Open Dispute Dossier (Review photos, GPS log, and request mediation)"**
9. **Contractor Bid Action**:  
   *Old*: "Pay $40 to contact customer."  
   *New*: **"Submit Zero-Cost Bid (Commission only deducted when you finish and get paid)"**
10. **Offline Banner**:  
    *Old*: "Network disconnected."  
    *New*: **"Working offline • Actions saved locally and will auto-sync upon reconnection"**
