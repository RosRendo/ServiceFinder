# 05: System Design Document
**Project:** Service Finder App

This document outlines the core system architectures that drive the platform.

---

## 1. BOOKING SYSTEM

**Flow & Actors:**
Customer → Booking Request → Payment Gateway (Stripe Auth) → Notification Engine → Company → Assign Staff → Staff → GPS Tracking → Completion → Payment Release (Capture) → Review System → Analytics Engine.

**Architecture:**
- **State Machine:** Bookings follow a strict state machine (`PENDING`, `ACCEPTED`, `ASSIGNED`, `EN_ROUTE`, `ARRIVED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
- **Idempotency:** Payment authorization requests must include idempotency keys to prevent double-charging on network failure.

---

## 2. REFUND & DISPUTE SYSTEM

**Flow & Actors:**
Customer → Request Refund → Company Response (Approve/Deny) → Admin Mediation (If Denied) → Payment Gateway → Refund Completed.

**Architecture:**
- **Escalation Rules:** If a Company does not respond to a refund request within 48 hours, it automatically escalates to the Admin queue.
- **Ledger Entries:** Refunds are not deleted rows; they create a counter-entry in the transaction ledger for accounting integrity.

---

## 3. NOTIFICATION SYSTEM

**Flow & Actors:**
Event Trigger (e.g., Booking Created) → Pub/Sub Queue → Notification Worker → Push/Email/SMS Gateway → User Device.

**Architecture:**
- **FCM (Firebase Cloud Messaging):** Used for realtime push notifications to the Expo mobile app.
- **SendGrid/AWS SES:** Used for transactional emails (receipts, password resets).
- **Batching:** Analytics reports are batched into weekly digests rather than sent instantly.

---

## 4. CHAT SYSTEM

**Flow & Actors:**
Customer → Send Message → WebSocket Server (NestJS) → Database (Persist) → Receiver (Company/Staff) → Push Notification (If Offline).

**Architecture:**
- **Real-time:** Driven by Socket.io.
- **Privacy:** Phone numbers are masked. Communication happens strictly through the in-app chat.
- **Safety:** All chats are plain-text (no E2E encryption) specifically so Admins can review them during disputes. Messages can be flagged for abuse.
