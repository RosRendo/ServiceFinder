# ServiceFinder Constitution

ServiceFinder is a production-oriented B2B2C home-services marketplace ecosystem connecting customers, service companies, and on-field staff.

## Core Principles

### I. Architectural Simplicity & Maintainability
- Prefer simple, maintainable architecture over unnecessary complexity.
- Follow existing project conventions before introducing new patterns or third-party dependencies.
- Do not modify unrelated features during implementation.

### II. Functional Preservation (Non-Destructive Evolution)
- Preserve existing working functionality across backend, web, and mobile unless the specification explicitly requires a change.
- Never refactor working subsystems outside the scope of the active feature specification.

### III. Technology Stack Boundaries
- **Backend**: NestJS (backend-nest), Prisma ORM, PostgreSQL, and Redis.
- **Frontend Web**: Next.js (frontend), React, TypeScript, and Tailwind CSS.
- **Mobile Client**: React Native / Expo (frontend-expo) for customers and field staff.
- **AI Intelligence**: Python microservice (ai-service).

### IV. Security, Authentication & Role-Based Access Control
- APIs must strictly enforce authentication (JWT) and role-based authorization (Customer, Company Admin, Staff, Platform Superadmin).
- Never expose sensitive customer, company, staff, payment (Stripe), or authentication credentials in logs, API responses, or client bundles.
- Geolocation and tracking endpoints must only allow customers to view the assigned staff member for their own active bookings.

### V. Database Migrations & Data Integrity
- All database modifications must use Prisma migrations.
- Direct ad-hoc schema edits are forbidden.
- Migrations must be non-destructive and backward-compatible.

### VI. Production Readiness, Resilience & Validation
- Production features require appropriate input validation, comprehensive error boundaries, and unit/integration tests.
- Systems must gracefully handle offline states, loading states, and permission denials (especially for mobile location tracking).
- Throttling and caching must be applied to high-frequency APIs (such as Google Maps or live location polling) to eliminate wasteful cloud costs.
