---
timestamp: 2026-10-26T05-15-15Z
slug: frontend-expo-app-customer
---
# Design critique — frontend-expo customer booking flow
Scope: frontend-expo/app/(customer) — tab bar, Home, Explore, service/company detail, BookingBottomSheet, checkout, booking receipt, activity, messages
Mode: product app (booking flow) · Depth: quick-to-standard · Method: dual-agent (A: subagent flow map, B: detector CLI)
Tooling note: detector produced no evidence — its TSX engine parses styled-components only, and this app uses React Native StyleSheet (no styled usage exists). Deterministic scan is unavailable for this surface; scoring is from code-level evidence, verbatim from files.

## Summary
Foundation is healthy — the core booking path is short and sensible (service detail → bottom sheet → checkout → receipt, ~5 taps with defaults). The breakage is in seams and intent-keeping, not structure: data silently fabricated at checkout (address default, date fallback), a dead-end in Messages, text doing false promises ("Rebook", tab labels), two different booking entry contracts. Score 22/40 Acceptable. Fix the two P0s first — they can send staff to the wrong place at the wrong time, which for a service marketplace is the "put in cart without price" class of failure.

## Score (22/40 · Acceptable)
- H2 Match real world: 3
- H8 Aesthetic/minimal: 3
- H1 System status, H3 Control/freedom, H4 Consistency, H5 Error prevention, H6 Recognition, H7 Flexibility, H9 Recovery, H10 Help: 2

## Findings
1. P0 · checkout.tsx:263 — booking created with placeholder `"Customer Location, Phnom Penh"` when user never sets an address. Fix: gate Pay button on a set address.
2. P0 · checkout.tsx:242–255 — date/time re-parsed by string-matching "Today"/"Tomorrow"+AM/PM text from the sheet; failure falls back to today, sheet default is tomorrow, and "10:00 AM" is stored raw in startTime. Displayed chips can disagree with what is booked. Fix: hand ISO values through the sheet (params or a draft store).
3. P1 · tabs/_layout.tsx:74 + message.tsx:134 — inactive tabs are icon-only with no permanent labels; first-time and older users must memorize them. Fix: always-on labels under icons.
4. P1 · message.tsx:100 + messages/new.tsx:24 — empty-state compose pencil pushes messages/new without companyId and just alert-bounces. Only real entry is from booking screens. Fix: remove or repoint the compose button.
5. P1 · checkout.tsx:559 vs BookingBottomSheet.tsx:155 — sheet price unformatted ($12.5) vs checkout two-dp; date/time read-only at checkout, back-sheet to change. Also cash payment taps straight to "Booked/Pending" with no confirmation of what happens next.
6. P2 · activity.tsx:264 — "Rebook" only opens the cancelled booking detail, which then says "Browse Services". Route it to the booked service detail instead.
7. P2 · home.tsx vs explore.tsx — Home rails and Explore duplicate categories/popular; two checkout entry contracts (already-created bookingId for instant vs temp params for scheduled).

## Least-loaded path (map)
A: tap service card → hover Big CTA "Book" → opens sheet → sheet → ✅ "Confirm" → inline success → home. Every step visited exactly once; sheet date/time/among 4 options only; payoff obvious at receipt.

## Cognitive load
Moderate — 2 failures: two competing booking modes at home top (Urgent Pro vs Schedule Ahead) with different downstream contracts; user must hold sheet choices in memory through checkout (mitigated by read-only chips). Chunking/grouping/ordering otherwise pass.

## Next actions
- P0 1–2: address gate + ISO handoff (small, checkout+sheet only).
- P1 3–4: tab labels; messages compose repoint.
- Then: cash-confirmation copy, Rebook routing, price formatting.
