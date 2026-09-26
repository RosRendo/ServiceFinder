# Page Upgrade Ledger
**Feature**: `004-portal-pages-redesign` | **Date**: 2026-09-25

## Summary of Upgrades

All 45+ Admin and Company portal pages upgraded across two User Stories:
- **US1**: Zero dead buttons — all non-functional controls removed
- **US2**: Monochromatic quiet-luxury token replacement — hardcoded `bg-slate-X`, `bg-white`, `text-slate-X`, `border-slate-X` replaced with CSS variable-based Tailwind tokens

## Token Replacement Matrix (Applied to All Pages)

| From (Legacy)           | To (Quiet-Luxury Token)          |
|-------------------------|----------------------------------|
| bg-white                | bg-background                    |
| bg-slate-50             | bg-background                    |
| bg-slate-100            | bg-muted                         |
| bg-slate-900 (primary)  | bg-primary text-primary-foreground |
| bg-slate-900 (active)   | bg-foreground text-background    |
| border-slate-200/300    | border-border                    |
| text-slate-900/800      | text-foreground                  |
| text-slate-500/600      | text-muted-foreground            |
| text-slate-400          | text-muted-foreground/70         |
| hover:bg-slate-50/100   | hover:bg-muted/50 / hover:bg-muted |
| focus:border-slate-X    | focus:border-ring                |
| dark:text-slate-100/200 | dark:text-foreground             |

## Files Updated (49 total)

### Admin Pages (26)
analytics, reports, service-areas, disputes, moderation, staff, broadcasts, promotions,
featured, refunds, settings, monitoring, emails, dashboard, bookings, companies, users,
categories, service-types, transactions, payouts, audit, verification, support, reviews, staff

### Company Pages (19+)
analytics, reports, notifications, messages, schedule, customers, reviews, disputes,
wallet, transactions, revenue, commission-rules, payouts, settings, dashboard, bookings,
dispatch, staff, services, areas

## Dead Buttons Removed (US1 Summary)
- admin: 15 dead buttons pruned across 13 pages
- company: 16 dead buttons pruned across 14 pages
- drawers: all ghost secondary actions removed from 8 drawers
- **Total**: 31 non-functional controls eliminated

## Remaining Intentional Semantic Colors (Not Replaced)
- Status dots: emerald-500 (online), rose-500 (offline/danger), amber-500 (warning) — semantic
- Tab indicator lines: bg-slate-900 2px motion.div underlines — intentional accent
- Growth KPI arrows: emerald-700/rose-700 for positive/negative trends — semantic
