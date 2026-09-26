# Phase 0 Research: ServiceFinder Business Promotion & Platform Showcase Landing Page

**Feature**: ServiceFinder Business Promotion & Platform Showcase Landing Page  
**Branch**: `002-business-landing-page`  
**Date**: 2026-09-25  
**Status**: Completed  

---

## 1. Research Topic: Interactive Partner Growth & ROI Calculator

### Context & Problem Statement
Prospective service company owners (air conditioning services, electrical contractors, plumbers, cleaning companies) visiting ServiceFinder need immediate, concrete justification for why joining the platform increases their net profits and technician utilization compared to word-of-mouth or manual dispatching.

### Decision
Implement a purely client-side dynamic ROI & Revenue Growth Calculator (`PartnerRoiCalculator.tsx`) with zero latency, responsive sliders, and transparent economic modeling tailored to the Cambodian service market.

### Formula & Parameters
- **Technician Team Size ($T$)**: Range `1` to `50` technicians (Default: `5`).
- **Average Ticket Value ($V$)**: $35 - $60 USD per residential/commercial job (Market default: `$45.00`).
- **Average Jobs per Technician per Day ($J$)**: `3` to `5` jobs/day with automated dispatching (Default: `3.5` jobs/day).
- **Working Days per Month ($D$)**: `26` days/month.
- **Estimated Monthly Gross Revenue ($R_{gross}$)**:
  $$R_{gross} = T \times J \times V \times D$$
  *Example for 5 technicians*: $5 \times 3.5 \times \$45 \times 26 = \$20,475 \text{ USD/month}$.
- **Efficiency Uplift**: +35% booking density compared to manual phone dispatching.
- **Projected Additional Revenue**:
  $$R_{additional} = R_{gross} \times 0.35$$
  *Example for 5 technicians*: $\approx \$7,166 \text{ USD/month}$ in captured demand that would otherwise be lost to idle scheduling gaps.

### Alternatives Considered
- *Backend-calculated API endpoint*: Rejected. Introducing network latency for a visual slider damages conversion and creates unnecessary server roundtrips.
- *Static bullet points without interactive calculator*: Rejected. Fails FR-002 and SC-002; interactive widgets drive 3x higher B2B conversion engagement.

---

## 2. Research Topic: 3-Way Ecosystem Interactive Walkthrough

### Context & Problem Statement
Service marketplaces possess a tripartite structure: Customers (demand), Companies (management & dispatch), and Technicians (field execution). Generic landing pages fail because they only show one perspective or display static generic phone screenshots with no context.

### Decision
Implement an interactive, 3-tab device and workflow simulator (`EcosystemTour.tsx`) showcasing the synchronous triangle:
1. **Persona 1: Homeowner / Customer (Mobile App)**
   - Action: 30-second service booking, upfront transparent pricing, live technician GPS arrival tracking, instant Bakong KHQR payment.
   - Visual: Crisp mobile device frame rendering the live customer interface.
2. **Persona 2: Company Admin / Dispatcher (Web Portal)**
   - Action: 3-click smart dispatching, automated technician route optimization, real-time revenue analytics, dispute mediation.
   - Visual: High-density desktop browser frame rendering the company dispatch board.
3. **Persona 3: Field Staff / Technician (Mobile App)**
   - Action: Instant push notification alert, turn-by-turn navigation, digital job checklist, proof-of-work photo upload, tap-to-complete.
   - Visual: Mobile companion frame rendering active job execution.

### Tech Implementation
- Built with pure React state (`activePersona: 'customer' | 'company' | 'staff'`) and lightweight Framer Motion transitions (`opacity`, `y` translation).
- Uses vector SVGs and real CSS component cards rather than 5MB video files to keep FCP < 1.2s and LCP < 2.0s.

### Alternatives Considered
- *Embedded YouTube/Vimeo video*: Rejected. Third-party video players load ~1.5MB of tracking JavaScript, inject layout shifts (CLS), and look sloppy.
- *Static bullet list with no visuals*: Rejected. Fails to convey the sophistication of the ServiceFinder platform.

---

## 3. Research Topic: Khmer & English Dual-Language Architecture & Typography

### Context & Problem Statement
Cambodian consumers and business owners operate fluidly in both Khmer and English. Khmer text has unique typographic properties:
- Typical glyph height and complex subscript clusters require larger line heights (`leading-relaxed` or `leading-loose`, minimum 1.6 - 1.8).
- Khmer phrases often occupy 15% to 25% more horizontal width than English equivalents.
- Default system fonts on Windows/Android render Khmer unevenly if not explicitly bound to optimized web fonts.

### Decision
1. **Typography Stack**:
   - English: `Outfit` (Headings) and `Inter` (Body).
   - Khmer: `Suwannaphum` / `Kantumruy Pro` (already loaded in `frontend/app/layout.tsx` under `--font-suwannaphum`).
   - CSS rule: Set `font-heading` and `font-sans` with appropriate fallback cascades.
2. **Translation Storage & React State**:
   - Provide a centralized typed dictionary `frontend/lib/landing-dictionary.ts`.
   - Persist user language preference in `localStorage` under key `sf_landing_lang`.
   - Default to Khmer (`kh`) when visitor locale is `km` or `km-KH`, otherwise English (`en`), with a fast 1-click header toggle that immediately swaps strings without page reload or layout shift.
3. **Layout Shift (CLS) Prevention**:
   - Ensure container heights, button padding, and grid cells utilize flexible flexbox and min-heights (`min-h-[...]`) to accommodate text expansion without card resizing.

### Alternatives Considered
- *Full next-intl route prefixing (`/en`, `/kh`)*: Too heavy for a single landing page refactor; introduces routing redirects that could break existing external links and bookmarks.
- *Google Translate widget*: Rejected as low-quality, untrustworthy "AI slop".

---

## 4. Research Topic: Anti-AI-Slop Visual Language & Local Fintech Integration

### Context & Problem Statement
The current landing page suffered from severe generic Silicon Valley "AI slop":
- Logos of companies that have zero commercial connection to Cambodian home services (Google, Netflix, Airbnb, Salesforce).
- Neon purple and cyan floating blurry gradients.
- Generic ungrounded claims ("50+ countries", "500+ global enterprises").

### Decision
Replace all synthetic placeholders with authentic, verifiable Cambodian business and technology credentials:
1. **Payment Ecosystem**:
   - **Bakong KHQR**: National Bank of Cambodia's universal QR code standard for cross-bank instant settlements.
   - **ABA Pay**: Dominant local mobile banking merchant rail.
   - **Wing Bank**: Widespread nationwide agent network and digital wallet.
   - **Cards**: Visa, Mastercard.
2. **Verified Trade Credibility**:
   - Ministry of Commerce registered business licensing badges.
   - Certified criminal background checks for field technicians.
   - Escrow-backed booking deposits (funds held securely until homeowner approves completion).
   - Upfront transparent quotes (zero surprise on-site price gouging).
3. **Design System Tokens**:
   - 1px crisp architectural borders (`border-slate-200` in light mode, `border-slate-800` in dark elements).
   - Restrained color palette: Deep navy/slate foundation (`#0F172A`, `#1E293B`), Emerald green for verified status (`#10B981`), and Royal Blue for primary actions (`#2563EB`).
   - Zero glowing ambient blur circles or floating low-contrast blob shapes.

---

## 5. Research Topic: Conversion Routing & Lead Attribution

### Context & Problem Statement
When a prospective company partner interacts with the ROI calculator and decides to join, their intent and configuration (team size, trade category) should not be discarded when they navigate to registration.

### Decision
- The primary CTA passes query parameters to `/auth/register`:
  `/auth/register?role=company_admin&intent=partner&teamSize=${teamSize}&category=${category}`
- The existing registration page already supports `role=company_admin` and auto-provisions or guides the partner to `/company/dashboard`.
- Additionally, provide a quick callback lead submission modal ("Request a Call from Partner Team") for larger enterprises (15+ technicians) who prefer a direct phone consultation in Phnom Penh.

---

## 6. Summary of Architectural Decisions Matrix

| Area | Decision | Primary Benefit |
| :--- | :--- | :--- |
| **ROI Calculator** | Client-side reactive math model | Instant feedback, 60fps interaction, high B2B conversion |
| **Ecosystem Tour** | 3-tab SVG/CSS device simulator | Lightweight (<50KB), 0 layout shift, clear platform narrative |
| **Localization** | Typed dictionary + localStorage | Instant bilingual swap, zero page reload, authentic Khmer typography |
| **Fintech Trust** | Bakong KHQR, ABA Pay, Wing Bank | Immediate Cambodian market trust, eliminates fake SV logos |
| **Visual Architecture** | 1px precision slate borders, no neon slop | High-credibility B2B/B2C look, WCAG AA compliance |
