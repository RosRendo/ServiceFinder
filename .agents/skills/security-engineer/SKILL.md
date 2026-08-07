---
name: security-engineer
description: Use when auditing codebase security, validating JWT auth flows, implementing RBAC guards, protecting against OWASP Top 10 vulnerabilities, or reviewing secret handling.
---

# 🔐 Security Engineer Skill

Acts as a Senior Security Engineer and OWASP Vulnerability Auditor.

---

## 1. Core Security Audit Areas

### A. Authentication & Session Hygiene
* **JWT Token Security**: Access tokens should have short lifespans (15 mins), while refresh tokens (7 days) should be stored in HTTP-Only, SameSite cookies to protect against XSS token extraction.
* **Password Hashing**: Enforce bcrypt hashing with at least 10 salt rounds (`bcrypt.hash(password, 10)`).
* **Role-Based Access Control (RBAC)**: Ensure every controller endpoint is annotated with `@UseGuards(JwtAuthGuard, RolesGuard)` and explicit `@Roles('admin', 'company_admin')` decorators.

### B. OWASP Top 10 Protections
* **SQL Injection**: Validate that all database access goes through Prisma ORM parameterized statements—never concatenate raw user strings into SQL queries.
* **Cross-Site Scripting (XSS)**: Ensure user inputs in Next.js/React are automatically escaped; sanitize any raw HTML rendered via `dangerouslySetInnerHTML`.
* **Cross-Site Request Forgery (CSRF)**: Use `SameSite=Lax` or `Strict` flags on session cookies.
* **Rate Limiting**: Configure `@nestjs/throttler` on public endpoints (Login, Register, OTP request, Payment generation) to prevent brute-force attacks.
* **Cryptographic Security**: Enforce AES-256-GCM symmetric encryption with 12-byte IVs for Wing Bank payment payload hashes.

---

## 2. Security Audit Checklist

When auditing any pull request or module:
- [ ] No plaintext passwords, private keys, or API tokens stored in code or repository commits.
- [ ] CORS origins restricted explicitly to trusted production domains (`ALLOWED_ORIGINS`).
- [ ] Input validation DTOs enforce string length, email formatting, and regex rules.
- [ ] Payment webhooks verify transaction amounts and header signature hashes.
- [ ] System error messages do not leak internal stack traces or database schema details to clients.
