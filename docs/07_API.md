# 07: API Document
**Project:** Service Finder App

This document outlines the API strategy and core endpoints (NestJS Backend).

---

## 1. Architecture
- **Protocol:** REST over HTTPS.
- **Data Format:** JSON for payloads, Multi-part Form Data for image uploads.
- **Authentication:** Bearer Token (JWT) passed in `Authorization` header.

## 2. Core Endpoints

### Auth (`/api/auth`)
- `POST /register` - Creates user, returns JWT.
- `POST /login` - Validates credentials, returns JWT.
- `POST /verify-otp` - Validates SMS/Email OTP.

### Customer (`/api/customer`)
- `GET /home` - Aggregated feed of featured companies and categories.
- `GET /search?q={query}&lat={x}&lng={y}` - Geospatial search for nearby services.
- `POST /bookings` - Initiates a new booking and returns a Stripe Client Secret.

### Company (`/api/company`)
- `GET /dashboard` - Returns aggregated metrics (revenue, active bookings).
- `GET /bookings?status=PENDING` - Fetches booking queue.
- `PATCH /bookings/:id/assign` - Assigns a `staff_id` to a booking.
- `POST /services` - Creates a new service in the catalog.

### Staff (`/api/staff`)
- `GET /schedule` - Returns jobs assigned to the requesting staff member.
- `PATCH /jobs/:id/status` - Updates job status (e.g., `status=ARRIVED`).
- `POST /jobs/:id/upload` - Uploads proof images for a job.

### Admin (`/api/admin`)
- `GET /analytics` - Platform-wide health metrics.
- `PATCH /users/:id/suspend` - Suspends an account.
- `POST /disputes/:id/refund` - Executes a refund resolution.

## 3. Real-time (WebSockets)
- `ws://chat` - Namespace for real-time messaging. Events: `join_room`, `send_message`, `receive_message`.
- `ws://tracking` - Namespace for GPS tracking. Staff emits `location_update`, Customer listens to `staff_location`.
