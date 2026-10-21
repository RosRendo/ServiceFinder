# Architecture Decision Record (ADR): Unified Dashboard Information Architecture

## Status
**Accepted & Implemented**

## Context & Problem Statement
In previous iterations, the sidebar presented three parallel top-level navigation items under the `Overview` section:
1. `Dashboard` (`/admin/dashboard` & `/company/dashboard`)
2. `Analytics` (`/admin/analytics` & `/company/analytics`)
3. `Reports` (`/admin/reports` & `/company/reports`)

### The UX Friction:
* **Cognitive Ambiguity**: Users experienced hesitation deciding between "Dashboard", "Analytics", and "Reports" when looking for metrics or business health.
* **Fragmented Flow**: Reviewing today's dispatch velocity, checking 30-day graphs, and downloading a financial statement required 3 full page reloads and navigating between separate sidebar links.
* **Sidebar Clutter**: The Overview group consumed unnecessary vertical real estate, pushing core operational tools below the fold.

## Decision: The Unified Command Center Architecture
We unified the navigation model following the Stripe / Linear command center pattern:

1. **Sidebar Streamlining**:
   * The sidebar `Overview` group now contains **only `Dashboard`** as the single primary home base.
   * Eliminates parallel redundant links.

2. **Master Segmented Tabs (In-Page Navigation)**:
   Inside the Dashboard, a tactile segmented control switches views with zero page reload:
   * **Live Pulse (`?tab=live` or default)**: Real-time telemetry, active bookings, dispatch velocity, triage queue, server health.
   * **Analytics & Trends (`?tab=analytics`)**: 30-day/90-day charts, conversion funnels, category breakdown, liquidity metrics.
   * **Reports & Financials (`?tab=reports`)**: P&L statements, transactions ledger, provider payout reconciliation, PDF/CSV downloads.

3. **URL State Synchronization**:
   * Switching tabs automatically synchronizes the URL (`?tab=analytics`, `?tab=reports`) via `window.history.replaceState` without triggering page refreshes.
   * Deep-linking and bookmarking are fully supported.

## Impact & Benefits
* **Zero Cognitive Friction**: Users have exactly one place to go for business operations and intelligence.
* **Quiet Luxury Aesthetics**: Cleaner sidebar with reduced visual noise.
* **Instant Interaction**: Zero latency when switching between operational pulse and historical charts.
