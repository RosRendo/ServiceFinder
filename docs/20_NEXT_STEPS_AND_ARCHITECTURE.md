# 20. Next Steps, Directory Map & Scaling Checklist

This document acts as your comprehensive guide, architectural reference, and developmental checklist for the **Service Finder** platform. Refer to this as you continue to build and scale your application.

---

## 1. Directory Structure Map

The active codebase is organized into four main application areas:

```
Service_Finder/
├── backend-nest/               # NestJS Monolith API (Active Server)
│   ├── prisma/                 # Database Schema & Seed scripts
│   ├── src/                    # API Controller, Service, and Module source code
│   └── ecosystem.config.js     # PM2 process configuration for production
│
├── frontend/                   # Next.js Web App
│   ├── app/                    # App Router Pages
│   │   ├── admin/              # Super Admin dashboard (KYC, disputes, stats)
│   │   ├── company/            # Company portal (Settings, staff list, coverage)
│   │   └── auth/               # Web authentication pages
│   ├── components/             # Reusable Shadcn UI blocks
│   └── lib/                    # HTTP clients, hooks, context state
│
├── frontend-expo/              # Expo React Native App (iOS/Android)
│   ├── app/                    # Expo Router screens
│   │   ├── (customer)/         # Customer booking, searching, checkout flow
│   │   ├── (company)/          # Provider dashboard & scheduling mobile tools
│   │   ├── (staff)/            # Worker job execution & check-in screens
│   │   └── (admin)/            # Basic mobile moderation/queue checks
│   └── store/                  # Client-side global state (Zustand)
│
└── scripts/                    # Maintenance & automation scripts
    ├── backup-db.sh            # Auto-backup cron target
    └── prepare-production.ps1  # Automated production build utility
```

---

## 2. Core User & Payment Flow

This diagram illustrates how a customer booking moves from initial request to worker fulfillment and provider payout:

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer (Mobile)
    actor Provider as Provider (Web/Mobile)
    actor Admin as Admin (Web)
    
    Customer->>Customer: Select Service & Date
    Customer->>Customer: Select Payment (ABA / Wing KHQR)
    Customer->>Provider: Request Booking
    Note over Customer,Provider: Status: PENDING
    
    alt Manual Dispatch Mode
        Provider->>Provider: Assigns specific Staff Member
    else Open Pool Mode
        Provider->>Provider: Job released; any Staff claims it
    end
    
    Note over Customer,Provider: Status: CONFIRMED
    
    Provider->>Customer: Performs service & Check-In
    Note over Customer,Provider: Status: IN_PROGRESS
    
    Provider->>Customer: Marks Job Completed
    Note over Customer,Provider: Status: COMPLETED
    
    alt If Customer Disagrees (Dispute)
        Customer->>Admin: Open Dispute Ticket
        Admin->>Admin: Review evidence
        Admin->>Customer: Resolve & Trigger Refund (if valid)
    else If Successful
        Note over Provider: Ledger splits 90% Provider, 10% Platform commission
        Provider->>Admin: Request Payout/Withdrawal
        Admin->>Provider: Approves Bank Transfer
    end
```

---

## 3. Current Completed Features

* [x] **Secure JWT Cookie Authentication:** Session-secured API authorization preventing JWT theft.
* [x] **Universal Customer Booking Engine:** Address mappings, schedules, pricing calculations, and invoice summaries.
* [x] **Multi-Gateway Payment WebViews:** Working integrations for ABA PayWay checkout, Bakong KHQR QR-generator, and Wing Bank OnlineSDK-KHQR encryption web flows.
* [x] **Dynamic Maps:** Visual coverage radius boundaries using Leaflet and geocoding auto-completes with Photon OpenStreetMap (removing expensive Google API dependencies).
* [x] **Provider Booking Profiles:** Coverage boundaries, pricing matrix tables, service catalog, and office hours.
* [x] **KYC Onboarding:** Admin drawer interface to approve/reject company identity files.

---

## 4. Platform Gaps & Bottlenecks (What to Fix)

Below are the features that need engineering attention before scaling up:

1. **File Upload Storage Solution:**
   * *Current Gap:* Many components store images/documents using local directory write paths.
   * *Fix:* Transition fully to Cloudinary or AWS S3 buckets for public assets.
2. **Real-time Live Chat:**
   * *Current Gap:* Chat between customers and workers operates via HTTP polling.
   * *Fix:* Upgrade the communication layer to Socket.io WebSockets.
3. **Staff Real-time GPS Tracking:**
   * *Current Gap:* The "Track Staff" map page reads static lat/long coords.
   * *Fix:* Inject active background GPS tracking (`expo-location`) to report worker locations during jobs.
4. **Push Notifications:**
   * *Current Gap:* Triggered notifications are currently written to database tables only.
   * *Fix:* Connect the NestJS server with Expo's push notification service to send system messages.

---

## 5. What to Do Next: Actionable Checklist

When you are ready to expand the app, follow this checklist in sequence:

### 🟩 Step 1: Polish the Backend Services (Medium Difficulty)
- [ ] Connect the NestJS backend to a live PostgreSQL database on a cloud service.
- [ ] Set up a database backup cron job targeting the provided script: `scripts/backup-db.sh`.
- [ ] Switch the local search endpoints to use Elasticsearch when handling service discovery.

### 🟨 Step 2: Implement Real-Time Messaging (High Difficulty)
- [ ] Connect your client apps with the backend WebSocket gateway.
- [ ] Set up Socket.io event listeners in `frontend-expo` to update chat channels instantly.

### 🟥 Step 3: Implement Map Geolocation Tracking (Advanced Difficulty)
- [ ] Configure `expo-location` on the mobile worker client.
- [ ] Emit worker coordinate changes over WebSockets when status is `in_progress`.
- [ ] Render a moving marker on the customer's "Track Staff" map screen.
