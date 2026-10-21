# Implementation Plan: Mobile End-to-End Flow & Real API Cleanup

**Branch**: `006-mobile-flow-cleanup` | **Date**: 2026-10-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-mobile-flow-cleanup/spec.md`

---

## Summary

Audit and clean up the customer mobile application flow in `frontend-expo` to transition from a corporate "e-commerce company catalog" into an **on-demand direct service booking engine (Grab / PassApp model)**. Ensure 100% of interactive buttons, chips, and links are functionally wired to real backend endpoints, render seeded high-resolution images, provide double-tap submission guards, and support an inline authentication drawer for guest checkouts.

---

## Technical Context

**Language/Version**: TypeScript 5.7+ (React Native / Expo 52+ / Node 20+)  
**Primary Dependencies**: Expo Router v4, React Native Maps, Zustand, Axios, Expo Secure Store, Expo Image, Socket.io-client  
**Storage**: PostgreSQL 16 (via Prisma ORM), Redis (Cache & PubSub), AsyncStorage (SWR Client Cache)  
**Testing**: Jest (`npm test` in `frontend-expo`), Vitest (`npx vitest` in `frontend`), TypeScript Compiler (`npx tsc --noEmit`)  
**Target Platform**: iOS 16+, Android 12+ (Expo Go & standalone native binaries)  
**Project Type**: Mobile Application Client (`frontend-expo`) communicating with NestJS REST API (`backend-nest`)  
**Performance Goals**: $\le 100\text{ms}$ tap-to-screen response, 60fps scroll performance, 0ms instant cached screen render  
**Constraints**: Zero unhandled 401 interceptor loops, offline grace mode with cached categories, no mock company photos  
**Scale/Scope**: 18 active trade categories, 25+ verified services, 5 customer tabs, 12 navigation sub-routes  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Evaluation | Status |
| :--- | :--- | :---: |
| **I. Architectural Simplicity & Maintainability** | Uses established Zustand stores (`customerHomeStore`, `authStore`) and Expo Router patterns without introducing redundant state libraries. | ✅ Pass |
| **II. Functional Preservation** | Non-destructive evolution; preserves all working backend schemas, admin controllers, and field staff WebSockets. | ✅ Pass |
| **III. Tech Stack Boundaries** | Adheres strictly to NestJS/Prisma for backend and Expo React Native for mobile client. | ✅ Pass |
| **IV. Security & Role Control** | Enforces JWT Bearer tokens; guest users can browse but are gated at checkout via inline auth drawer. | ✅ Pass |
| **V. Database Integrity** | Zero ad-hoc database edits; all new records are managed via Prisma migrations and seed scripts. | ✅ Pass |
| **VI. Production Readiness** | Includes double-tap debouncing on all checkout/order actions, error fallbacks for GPS, and 100% type checks. | ✅ Pass |

---

## Project Structure

### Documentation (this feature)

```text
specs/006-mobile-flow-cleanup/
├── plan.md              # This file
├── research.md          # Phase 0: Technical decisions and endpoint matrix
├── data-model.md        # Phase 1: Data structures and state contracts
├── quickstart.md        # Phase 1: Verification guide & test accounts
├── contracts/           # Phase 1: API JSON Schema contracts
│   ├── booking-create.schema.json
│   └── instant-request.schema.json
└── checklists/
    └── requirements.md  # Spec quality validation checklist
```

### Source Code Paths (Modified & Verified)

```text
frontend-expo/
├── app/
│   ├── (customer)/
│   │   ├── (tabs)/
│   │   │   ├── home.tsx            # Visual tactile cards, live pro radar, direct 1-tap book
│   │   │   ├── explore.tsx         # Catalog search, debounced query, trade filters
│   │   │   ├── activity.tsx        # Active/historical bookings segment with pull-to-refresh
│   │   │   └── profile.tsx         # Saved addresses, settings, clean logout
│   │   ├── service/
│   │   │   └── [id].tsx            # Service details with real images, checklist, book CTA
│   │   ├── checkout.tsx            # Direct booking form, custom GPS address, Bakong KHQR & Cash
│   │   ├── map-view.tsx            # Urgent Pro instant dispatch with live technician radar
│   │   └── booking/
│   │       ├── [id].tsx            # Active lifecycle, Call staff, Chat staff, Cancel, Review
│   │       ├── messages.tsx        # In-app chat with assigned tech
│   │       └── reschedule.tsx      # Slot adjustment flow
│   └── _layout.tsx                 # Root navigation and deep link handlers
├── store/
│   ├── authStore.ts                # JWT interceptor with silent refresh & guest safety
│   ├── customerHomeStore.ts        # Instant SWR caching (0ms load)
│   └── paymentStore.ts             # Checkout payment state
└── constants/
    └── theme.ts                    # Centralized pastel palette & design tokens
```

---

## Implementation Phases

### Phase 0: Research & Alignment (Complete)
- Evaluated Grab/PassApp direct dispatch model vs corporate company directory.
- Defined inline quick-login sheet behavior for guest checkouts.
- Mapped all real backend endpoints and seeded 25+ real-image services into Postgres.

### Phase 1: Design & Contract Definition (Complete)
- Created JSON Schemas for `POST /api/bookings` and `POST /api/instant-requests`.
- Outlined data entities (`Service`, `Booking`, `UserAddress`, `Company`).
- Produced testing checkpoints and quickstart manual.

### Phase 2: Execution Tasks (Via `/speckit-tasks`)
- Task 1: Audit and wire all action buttons on `home.tsx` and `explore.tsx`.
- Task 2: Enhance `checkout.tsx` with dynamic address coordinates, Cash on Delivery option, and double-tap guards.
- Task 3: Implement inline guest authentication bottom sheet on checkout gating.
- Task 4: Validate `booking/[id].tsx` lifecycle actions (Call staff, Chat staff, Cancel, Review).
- Task 5: Run end-to-end regression tests (`npm test`, `npx tsc --noEmit`).

---

## Complexity Tracking

> No constitutional violations or unwarranted complexity. Architecture adheres strictly to project standards.
