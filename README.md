# ServiceFinder — Hyperlocal On-Demand Service Marketplace & Dispatch Ecosystem

<div align="center">

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-Web_Portal-black?logo=next.js)
![Expo](https://img.shields.io/badge/Expo-React_Native_Mobile-000020?logo=expo)
![NestJS](https://img.shields.io/badge/NestJS-Backend_Core-E0234E?logo=nestjs)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-PostGIS_Geospatial-4169E1?logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-BullMQ_Dispatcher-DC382D?logo=redis)
![WebSockets](https://img.shields.io/badge/WebSockets-Live_Tracking-010101?logo=socket.io)
![KHQR](https://img.shields.io/badge/Bakong_KHQR-ABA_PayWay-D32F2F)
![pnpm](https://img.shields.io/badge/Maintained_with-pnpm-F69220?logo=pnpm)

**An enterprise multi-sided on-demand services platform connecting customers with verified companies and freelance specialists, featuring real-time geospatial dispatch, bidding, and KHQR/ABA escrow settlements.**

[System Architecture](#-system-architecture) • [Database ERD](#-database-entity-relationship-diagram) • [Dispatch Sequence](#-hyperlocal-dispatch--booking-flow) • [Quick Start](#-quick-start)

</div>

---

## ⚡ Overview

**ServiceFinder** is an on-demand service ecosystem designed for home repairs, cleaning, mechanics, and certified professional services. It combines a Next.js web portal, an Expo React Native cross-platform mobile app, and a robust NestJS backend with PostGIS spatial indexing for precision distance matching, real-time live location dispatch, and Cambodian/international payment gateways.

---

## 🏗 System Architecture

```mermaid
flowchart TD
    subgraph ClientTier["📱 Client Experience Layer"]
        WebPortal["Next.js Responsive Web Portal"]
        MobileApp["Expo React Native Mobile App (iOS / Android)"]
        ProviderApp["Provider & Staff Dispatch Terminal"]
        
        WebPortal & MobileApp & ProviderApp
    end

    subgraph APIGateway["⚡ Gateway & Infrastructure"]
        Nginx["Nginx Reverse Proxy & SSL Termination"]
        NestCore["NestJS Modular Microservices Core"]
        AuthGuard["JWT / OAuth / MFA Auth Guard"]
        WebSocketHub["Gateway WebSocket Hub (Live GPS & Chat)"]
        
        ClientTier <--> Nginx
        Nginx <--> NestCore
        Nginx <--> WebSocketHub
        NestCore --> AuthGuard
    end

    subgraph ServiceModules["⚙️ Core Business Engines"]
        GeoService["PostGIS Geospatial Matching Engine"]
        InstantReq["Instant Request & Bidding Service"]
        BookingEngine["Booking Lifecycle & Status Tracker"]
        PaymentEngine["ABA PayWay & Bakong KHQR Escrow Gateway"]
        NotificationEngine["Firebase FCM Push & Email Templates"]
        
        NestCore --> GeoService
        NestCore --> InstantReq
        NestCore --> BookingEngine
        NestCore --> PaymentEngine
        NestCore --> NotificationEngine
    end

    subgraph DataStorage["💾 Persistence & Messaging"]
        Postgres[(PostgreSQL + PostGIS DB)]
        Redis[(Redis Cache, Locks & BullMQ)]
        FCM["Firebase Cloud Messaging"]
        
        GeoService <--> Postgres
        BookingEngine <--> Postgres
        PaymentEngine <--> Postgres
        InstantReq <--> Redis
        NotificationEngine --> FCM
    end
```

---

## 📊 Database Entity-Relationship Diagram

```mermaid
erDiagram
    users ||--o{ ownedCompanies : "owns"
    users ||--o{ staffMemberships : "employed_as"
    users ||--o{ bookingsAsCustomer : "books"
    users ||--o{ reviews : "writes"
    users ||--o{ payments : "makes"
    users ||--o{ instantRequests : "submits"
    
    companies ||--|{ company_staff : "employs"
    companies ||--|{ services : "offers"
    companies ||--o{ bookings : "receives"
    companies ||--o{ instant_request_bids : "bids_on"
    
    services ||--o{ bookings : "fulfilled_in"
    bookings ||--o{ payments : "settled_by"
    bookings ||--o{ reviews : "reviewed_in"
    bookings ||--o{ disputes : "has"

    users {
        bigint id PK
        varchar fullName
        varchar email UK
        varchar phone UK
        enum role "customer | company_owner | staff | admin"
        enum status "active | suspended | pending"
        decimal latitude
        decimal longitude
        varchar pushToken
        boolean mfaEnabled
        datetime createdAt
    }

    companies {
        bigint id PK
        varchar name
        varchar registrationNumber
        varchar phone
        varchar email
        bigint ownerId FK
        decimal latitude
        decimal longitude
        enum verificationStatus "pending | verified | rejected"
        decimal ratingAverage
        int reviewCount
        datetime createdAt
    }

    company_staff {
        bigint id PK
        bigint companyId FK
        bigint userId FK
        varchar role "manager | technician"
        boolean isAvailable
        datetime createdAt
    }

    services {
        bigint id PK
        bigint companyId FK
        varchar title
        text description
        decimal basePrice
        int durationMinutes
        boolean isActive
    }

    bookings {
        bigint id PK
        bigint customerId FK
        bigint companyId FK
        bigint serviceId FK
        bigint assignedStaffId FK
        datetime scheduledTime
        decimal totalPrice
        enum status "pending | accepted | in_progress | completed | cancelled"
        datetime createdAt
    }

    instant_requests {
        bigint id PK
        bigint customerId FK
        varchar serviceCategory
        text description
        decimal latitude
        decimal longitude
        enum status "searching | bidding | matched | expired"
        datetime createdAt
    }

    instant_request_bids {
        bigint id PK
        bigint requestId FK
        bigint companyId FK
        decimal priceEstimate
        int etaMinutes
        enum status "pending | accepted | rejected"
        datetime createdAt
    }

    payments {
        bigint id PK
        bigint bookingId FK
        bigint userId FK
        decimal amount
        varchar paymentMethod "aba_payway | khqr | card | cash"
        varchar transactionId UK
        enum status "pending | held_in_escrow | released | refunded"
        datetime createdAt
    }

    reviews {
        bigint id PK
        bigint bookingId FK
        bigint userId FK
        int rating "1-5"
        text comment
        datetime createdAt
    }
```

---

## 🔄 Hyperlocal Dispatch & Booking Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant App as Mobile / Web Client
    participant Nest as NestJS Backend
    participant Geo as PostGIS Geo Engine
    participant Redis as BullMQ & Redis Hub
    actor Provider as Nearby Service Provider

    Customer->>App: Request Emergency AC Repair (Location: GPS)
    App->>Nest: POST /api/instant-requests (Category, Coordinates, Radius: 10km)
    Nest->>Geo: Query Nearby Active & Verified Companies
    Geo-->>Nest: List of 5 Matching Providers Within Radius
    
    Nest->>Redis: Broadcast Bid Opportunity (120s TTL)
    Redis-->>Provider: Push Notification ("New Request: AC Repair 2.4km away")
    
    Provider->>Nest: POST /api/instant-requests/:id/bid (ETA: 20 mins, $35)
    Nest-->>App: Push Real-Time Bid Cards via WebSocket
    
    Customer->>App: Accept Provider Bid & Pay
    App->>Nest: POST /api/bookings/checkout (KHQR / ABA PayWay)
    Nest-->>App: Generate Dynamic Bakong KHQR Deep Link
    Customer->>Customer: Complete Payment in Banking App
    
    Nest->>Nest: Hold Funds in Escrow & Lock Staff
    Nest-->>Provider: Dispatch Confirmed Job Order with Route Map
    Nest-->>App: Switch to Live GPS Technician Tracking
```

---

## 📦 Key Capabilities

- **Hyperlocal Geo-Dispatching**: Spatial indexing matches customers with the closest qualified service technicians in real time.
- **Reverse Bidding Engine**: Broadcast immediate job needs and allow certified specialists to submit instant bids with ETAs.
- **Escrow & Multi-Rail Payments**: Integrates Cambodian Bakong KHQR, ABA PayWay, and credit cards with payment escrow release on job completion.
- **Cross-Platform Mobile App**: Native iOS & Android support via Expo React Native with push notifications and GPS location tracking.
- **Company Management Portal**: Dedicated dashboards for service providers to manage staff, assign tickets, and review revenue reports.

---

## 🚀 Quick Start

### 1. Backend Service (NestJS)
```bash
cd backend-nest
pnpm install

# Setup Environment
cp .env.example .env
# Set DATABASE_URL, REDIS_HOST, ABA_MERCHANT_ID, FIREBASE_CREDENTIALS

# Run Database Migrations
pnpm prisma db push

# Start NestJS API
pnpm run start:dev
```

### 2. Frontend Web Portal (Next.js)
```bash
cd ../frontend
pnpm install
pnpm run dev
```

### 3. Mobile App (Expo)
```bash
cd ../frontend-expo
pnpm install
pnpm run start
```

---

## 📄 License
Proprietary & Confidential — Engineered by **[Ros Rendo](https://github.com/RosRendo)**