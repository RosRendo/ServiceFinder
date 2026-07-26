# 06: Database Document
**Project:** Service Finder App

This outlines the primary relational entities and their relationships.

---

## 1. Core Entities

### User Table (`users`)
Stores all authentication and role data.
- `id` (UUID)
- `email`, `phone`, `password_hash`
- `role` (ENUM: CUSTOMER, COMPANY_ADMIN, STAFF, SUPER_ADMIN)
- `push_token` (FCM)
- `company_id` (Nullable - Foreign Key to companies if role is STAFF/COMPANY_ADMIN)

### Company Table (`companies`)
- `id` (UUID)
- `name`, `description`, `logo_url`
- `verification_status` (ENUM: PENDING, VERIFIED, SUSPENDED)
- `stripe_connect_account_id` (For payouts)
- `rating_avg` (Decimal)

### Service Catalog (`services`)
- `id` (UUID)
- `company_id` (FK)
- `category_id` (FK)
- `title`, `description`
- `base_price` (Decimal)
- `estimated_duration_minutes` (Int)

### Booking Table (`bookings`)
The central nervous system of the app.
- `id` (UUID)
- `customer_id` (FK)
- `company_id` (FK)
- `service_id` (FK)
- `staff_id` (Nullable FK)
- `status` (ENUM: PENDING, ACCEPTED, EN_ROUTE, IN_PROGRESS, COMPLETED, CANCELLED)
- `scheduled_time` (Timestamp)
- `total_amount` (Decimal)
- `stripe_payment_intent_id` (String)
- `address_lat`, `address_lng`, `address_text`

### Review Table (`reviews`)
- `id` (UUID)
- `booking_id` (FK)
- `customer_id` (FK)
- `company_id` (FK)
- `staff_id` (FK)
- `rating` (Int 1-5)
- `comment` (Text)

## 2. Relationships
- A `User (Customer)` has many `Bookings`.
- A `Company` has many `Services`, `Staff`, and `Bookings`.
- A `Booking` belongs to exactly one `Customer`, `Company`, `Service`, and (eventually) `Staff`.
- A `Review` is strictly tied to a completed `Booking`.
