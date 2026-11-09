---
target: frontend/app/page.tsx section pipeline
total_score: 15
max_score: 24
na_heuristics: 5,7,9,10
p0_count: 2
p1_count: 2
timestamp: 2026-10-22T05-08-07Z
slug: frontend-app-page-tsx
---
## Landing Section Critique (summary snapshot)

Method: degraded single-context (A isolated sub-agent; detector inline). Score 15/24 Acceptable (63%).

Detector: 0 findings on page.tsx + landing components.

P0 Wrong page for buyer: B2B hero -> bank logo viewport -> first consumer section -> B2B ROI calculator. Fix: reorder Hero -> CategoryExplorer -> Trust -> EcosystemTour -> SocialProof -> ROI + ComparisonTable (B2B evidence block) -> slim partner band -> FAQ -> dual-CTA band -> Footer; consumer-voiced H1 with B2B line as sub-badge.

P0 Proof stack with no ask: Trust/SocialProof/FAQ sit after last CTA. Fix: dual-track final band + footer app strip hosting AppDownloadModal QR.

P1 Three stat bands + contradiction (real numbers vs illustrative disclaimer; 99.4% vs 4.9/5). P1 Simulator stack in EcosystemTour (3 simulators, tab-in-tab, redundant pipeline; defaults to company persona). P2 Invented trust seals (ENCRYPTED DEPOSIT / BIOMETRIC VERIFIED / SLA GUARANTEED) vs real ones (MoC registration, NBC/Bakong). P2 PartnershipCarousel filter pills cannot filter a marquee. Minor: provider counts 700 vs 500+ claim; 9-10px Khmer clipping; emoji vs lucide clash.

Bold direction: reorder + consumer-first hero + final CTA band (user-selected scope: top 2 workstreams).
