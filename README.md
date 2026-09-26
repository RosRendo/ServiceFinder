# ?? Service Finder — On-Demand Services Marketplace & Dispatch Platform

> Production-ready multi-sided service platform featuring Customer Booking, Business Operations Dashboard, Admin Governance, and Real-Time Staff Dispatch tracking.

---

## ? Overview
**Service Finder** is a complete Cambodian on-demand marketplace connecting consumers with trusted local service professionals (AC repair, cleaning, mechanics, tutoring, and home maintenance). It includes customer web apps, cross-platform mobile apps via React Native Expo, a B2B company operations portal, and a super-admin management hub.

---

## ??? Architecture Topology

- **Web Portal**: Next.js 15, Tailwind CSS, Radix UI, Zustand (Port 3004)
- **Mobile Apps**: React Native with Expo Router & KHQR payment scanner
- **Backend API**: NestJS, Prisma ORM, WebSockets Gateway, JWT Authentication (Port 3000)
- **Database**: PostgreSQL with PostGIS geo-location radius queries

---

## ?? Key Modules
1. **Customer Marketplace**: Geolocation service explorer, category filters, interactive booking wizard, and KHQR payments.
2. **Company Operations Hub**: Schedule dispatching, team assignments, revenue analytics, and commission management.
3. **Staff Mobile Tracking**: Live job cards, GPS routing map, status transitions (Dispatched ? In Progress ? Completed).
4. **Super-Admin Governance**: Verification drawer, company payouts, dispute resolution, and audit logging.

---

## ??? Quick Start

### Backend (NestJS)
`ash
cd backend-nest
npm install
npm run start:dev
`

### Web Frontend (Next.js)
`ash
cd frontend
npm install
npm run dev
`

---

## ?? License
Private & Proprietary — Ros Rendo
