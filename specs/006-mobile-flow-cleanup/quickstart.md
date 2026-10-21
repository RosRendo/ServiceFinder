# Quickstart & Verification Guide: Mobile Flow Cleanup

**Feature**: `006-mobile-flow-cleanup`  
**Date**: 2026-10-05  

---

## 1. Prerequisites & Services

Ensure the backend services are running:

```bash
# 1. Terminal 1: NestJS Backend API
cd "d:\FOR RENDO (ONLY )\Personal Project\Service_Finder\backend-nest"
npm run start:dev

# 2. Terminal 2: Expo Mobile Client
cd "d:\FOR RENDO (ONLY )\Personal Project\Service_Finder\frontend-expo"
npx expo start
```

---

## 2. Seeded Test Credentials

Use these verified accounts to test different roles and customer states:

| Role | Email | Password | Phone |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@demo.com` | `password123` | `+85512000002` |
| **Admin** | `admin@servicefinder.com` | `password123` | `+85512000001` |
| **Field Staff** | `staff1@demo.com` | `password123` | `+2222222201` |
| **Company Owner**| `owner1@demo.com` | `password123` | `+85512100001` |

---

## 3. End-to-End Verification Checkpoints

### Checkpoint 1: Home Screen Discovery
1. Open Expo app (Customer role or Guest).
2. Verify category plates load with pastel backgrounds (HVAC: Blue, Cleaning: Mint, Plumbing: Cyan, Electrical: Amber).
3. Verify service cards display **100% real high-res images**, upfront price (`From $18.00`), and telemetry pills (`● 15m arrival`).
4. Tap any service card $\rightarrow$ Navigates to `service/[id]`.

### Checkpoint 2: Direct 1-Tap Checkout
1. On `service/[id]`, tap "Book Pro Now".
2. On `checkout.tsx`, confirm address displays either custom GPS coordinates or default city.
3. Select payment method (**Bakong KHQR** or **Cash on Completion**).
4. Tap "Confirm Booking" $\rightarrow$ Spinner displays, button disables, booking creates via `POST /api/bookings`.
5. Screen redirects cleanly to `/(customer)/booking/[id]`.

### Checkpoint 3: Active Booking Lifecycle
1. On `booking/[id]`, verify:
   - Timeline step indicates active status (`Confirmed` or `In Progress`).
   - "Call Staff" triggers native dialer.
   - "Chat with Staff" navigates to messages conversation.
   - "Cancel Booking" prompts for confirmation and calls cancel API.

### Checkpoint 4: Automated Test Validation
Run unit tests in both projects:
```bash
# In frontend-expo:
npm test
npx tsc --noEmit

# In frontend (web):
npx vitest run __tests__/landing
```
