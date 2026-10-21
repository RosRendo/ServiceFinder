# Architectural Research: Enterprise Clean Business Admin Redesign

**Feature**: `011-redesign-all-page` | **Date**: 2026-10-06  
**Subject**: Visual discipline, hierarchy standards, and institutional design patterns for all admin mobile pages.

---

## Decision 1: Monochromatic & Charcoal Corporate Palette (Eliminating Candy Colors)

### Context & Challenge
Previous iterations incorporated varying candy-tinted icon backgrounds (`#D1FAE5` mint, `#FEF3C7` yellow, `#E0F2FE` sky blue, `#F3E8FF` lavender) and colorful gradient tags. While functional, the user explicitly noted this felt "too colorful" and requested a redesign that looks "like company... more like business thing, clean, well hierarchy, workflow well".

### Decision
Establish an institutional, monochromatic baseline across all admin screens:
- **Primary Surfaces**: Pure white `#FFFFFF` for cards; clean slate `#F8FAFC` for page root backgrounds; subtle `#F1F5F9` for secondary cell insets.
- **Dividers & Borders**: Crisp, hairline `#E2E8F0` borders (`borderWidth: 1`) on all cards, cells, and dividers.
- **Typography Scale**: Deep slate `#0F172A` for headers, primary metrics, and primary buttons; `#334155` for values and body copy; `#64748B` for uppercase tracking labels (`letterSpacing: 0.6`).
- **Strict Semantic Status Signaling**: Saturated color is banned from decorative fills and icon containers. Color is strictly confined to small, functional status dots (6–8dp) and subtle pill badges:
  - **Verified / Operational**: Subtle emerald `#059669` (dot or `#ECFDF5` pill).
  - **Pending / Action Due**: Subtle amber `#D97706` (dot or `#FEF3C7` pill).
  - **Dispute / Critical Alert**: Subtle crimson `#DC2626` (dot or `#FEF2F2` pill).
  - **All other icons**: Slate `#475569` or `#64748B` on neutral `#F1F5F9` or transparent backgrounds.

### Alternatives Considered
- *Dark mode only (Obsidian `#0A192F` across all screens)*: Rejected because reading high-density compliance documents, registration tables, and audit logs on pure dark mode increases cognitive fatigue for administrative staff during long review sessions. Deep slate `#0A192F` is preserved for top hero ribbons/navigation, while card surfaces remain crisp enterprise white.
- *Keeping pastel backgrounds*: Rejected because pastel clusters (mint + amber + purple + blue) create a playful "toy dashboard" feel rather than a rigorous enterprise governance tool.

---

## Decision 2: High-Density Structured Key-Value Metadata Grid

### Context & Challenge
Administrative staff review complex business entities (tax registration numbers, business categories, owners, phone numbers, SLA timers, escrow sums, and license documents). Freeform text blocks or scattered icon rows reduce scanning speed and increase verification error rates.

### Decision
Standardize a two-column key-value ledger pattern across all business and dispute cards:
```text
┌────────────────────────────────────────────────────────┐
│  [Logo] Acme Plumbing LLC            [• VERIFIED ACTIVE] │
│  Registration: 2026-PLUMB-98214                        │
├──────────────────────────┬─────────────────────────────┤
│  BUSINESS OWNER          │  PRIMARY LOCATION           │
│  Johnathan Davis         │  Phnom Penh Capital         │
├──────────────────────────┼─────────────────────────────┤
│  HOTLINE                 │  ACTIVE SERVICES            │
│  +855 12 345 678         │  8 Listed Services          │
└──────────────────────────┴─────────────────────────────┘
```
- Labels are consistently rendered in bold uppercase (`fontSize: 10`, `fontWeight: "700"`, `color: "#94A3B8"`, `letterSpacing: 0.5`).
- Values are rendered in crisp dark slate (`fontSize: 13`, `fontWeight: "700"`, `color: "#0F172A"`).
- Separators use hairline dividers (`backgroundColor: "#E2E8F0"`, `height: 1`).

---

## Decision 3: Uniform Screen Hierarchy & Predictable Workflow Flow

### Context & Challenge
Across mobile admin screens, differing layouts (some with horizontal Kanbans, some with vertical lists, some with cards, some with tables) disorient users and break predictable mental models.

### Decision
Enforce a four-tier visual hierarchy across all screens:
1. **Tier 1 — Top Executive Command Bar**:
   - Navigation action (menu drawer trigger or back chevron).
   - High-contrast screen title (`fontSize: 18–20`, `fontWeight: "800"`).
   - Live quantitative counter pill (`#0F172A` background, white bold count).
2. **Tier 2 — Executive Summary / Filter Strip**:
   - High-level metric ribbon (e.g. Total Volume, Active Hold, SLA Deadline).
   - Single-axis segmented status control (`#E2E8F0` pill track, `#0A192F` active selection).
3. **Tier 3 — High-Density Ledger List (`@shopify/flash-list`)**:
   - Structured business cards with two-column metadata grids.
   - Quick expansion trigger for documents or evidence counter-claims.
4. **Tier 4 — Corporate Governance Actions**:
   - Primary action: Institutional charcoal `#0A192F` button.
   - Secondary action: Neutral bordered `#FFFFFF` button with `#E2E8F0` stroke.
   - Destructive action: Subtle crimson outline button (`#FEF2F2` background, `#DC2626` text).

---

## Decision 4: Safe Floating Tab Bar Clearance Standard

### Context & Challenge
The admin shell uses a floating pill navigation tab bar anchored at `bottom: 0`. Any scroll view with standard mobile insets (`paddingBottom: 20` to `60`) has its lowest interactive buttons obscured.

### Decision
Standardize `paddingBottom: 120` across all scroll content containers:
- `(tabs)/dashboard.tsx`
- `(tabs)/queue.tsx`
- `(tabs)/issues.tsx`
- `(tabs)/companies.tsx`
- `(tabs)/users.tsx`
- `(tabs)/analytics.tsx`
- `(tabs)/settings.tsx`
- Secondary screens (`payouts.tsx`, `refunds.tsx`, `audit.tsx`, `monitoring.tsx`, `company/[id].tsx`, `disputes/[id].tsx`).
