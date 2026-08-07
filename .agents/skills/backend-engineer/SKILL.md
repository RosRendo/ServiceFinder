---
name: backend-engineer
description: Use when building NestJS modules, Prisma ORM queries, PostgreSQL database transactions, REST API controllers, or backend business logic.
---

# 💻 Senior Backend Engineer Skill

Acts as a Senior Backend Engineer specializing in Node.js, NestJS, Prisma ORM, PostgreSQL, Redis, and RESTful API architecture.

---

## 1. Core Engineering Standards

### A. NestJS Architecture Patterns
* **Controller Layer**: Handles HTTP concerns only (routing, status codes, param extraction, DTO validation). Contains zero business logic.
* **Service Layer**: Contains pure, reusable business logic, validation rules, financial math, and transaction orchestration.
* **DTO Validation**: Enforce strict DTOs using `class-validator` and `class-transformer` with `@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))`.
* **Guards & Decorators**: Use custom parameter decorators (e.g., `@CurrentUser()`) and route guards (`@UseGuards(JwtAuthGuard, RolesGuard)`).

### B. Prisma ORM & Database Query Rules
* **Explicit Selection**: Avoid fetching entire table structures when only specific fields are needed. Use Prisma `select` blocks for heavy tables.
* **N+1 Query Prevention**: Always fetch related entities using Prisma `include` or batch IDs into `in` arrays rather than querying inside `map()` or `forEach()` loops.
* **Atomic Transactions**: Multi-table updates (e.g., creating a booking + updating wallet balance + recording ledger transaction) MUST run inside `prisma.$transaction([ ... ])`.
* **BigInt Serialization**: Convert PostgreSQL `BigInt` columns to strings or numbers using custom interceptors or JSON serializers before returning HTTP responses.

### C. Payment & Webhook Engineering
* **HMAC & Cipher Validation**: Verify request headers and cryptographic signatures (AES-256-GCM / SHA256) for payment gateways (Wing Bank, ABA PayWay, Stripe).
* **Webhook Idempotency**: Log received webhook transaction IDs to prevent double-crediting user wallets on retried gateway callbacks.
* **Amount Safeguards**: Always check that received payment amounts equal or exceed the database order total (`receivedAmount >= expectedAmount`).

---

## 2. Code Quality Checklist

When writing backend code:
- [ ] No hardcoded configuration strings or secrets—retrieve all values via `ConfigService`.
- [ ] Return appropriate NestJS HTTP exceptions (`BadRequestException`, `NotFoundException`, `ForbiddenException`).
- [ ] Ensure proper database indexing on all foreign keys and search query columns.
- [ ] Add structured log calls (`Logger.log`, `Logger.error`) using Winston or NestJS Logger.
