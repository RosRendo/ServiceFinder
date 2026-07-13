# 🏗️ Full-Stack App Build Checklist

> Click items to mark done · Switch tier to change scope  
> **Required** = must do · **optional** = skip if time is short

---

## 📊 Cost + Time Overview

| Tier | Time | Cost/mo | Team |
|------|------|---------|------|
| MVP | 4–8 weeks | $0–$200 | 1–2 devs |
| Supabase / Firebase | 6–12 weeks | $25–$500 | 1–3 devs |
| From Scratch | 3–6 months | $100–$2k | 2–5 devs |
| Enterprise | 6–18 months | $2k–$50k | 5–50 devs |

---

---

# 🟢 TIER 1: MVP
> Ship fast, validate idea. Use hosted services only. No DevOps needed.
> **4–8 weeks · $0–$200/mo · 1–2 devs**

---

## Part 1 — Design & Setup *(Before writing code)*

### 🎨 Design (UI/UX)
- [ ] Create Figma wireframes (free tier) **required**
- [ ] Define color system + typography **required**
- [ ] Design responsive breakpoints (mobile-first) **required**
- [ ] Component library in Figma *optional*

### ⚙️ Frontend — Framework Choice
- [ ] Choose: Next.js (recommended) / Remix / Vite+React **required**
- [ ] Optional: Vue 3 + Nuxt / SvelteKit / Astro *optional*
- [ ] Init project: `npx create-next-app@latest` **required**
- [ ] Set up Tailwind CSS + shadcn/ui **required**
- [ ] ESLint + Prettier config **required**
- [ ] `npm run lint` — pass before any feature **required**

### 🗄️ Backend — BaaS (MVP approach)
- [ ] Supabase: init project, get ANON key + URL **required**
- [ ] Or: Firebase (Firestore + Auth) **required**
- [ ] Set up env vars (`.env.local`) **required**
- [ ] Define DB schema in Supabase table editor **required**

---

## Part 2 — Core Features *(Authentication, data, UI)*

### 🔐 Auth
- [ ] Supabase Auth: email/password + OAuth (Google) **required**
- [ ] Protected routes (Next.js middleware) **required**
- [ ] Session handling + refresh tokens **required**
- [ ] Magic link login *optional*
- [ ] Auth.js (NextAuth) if custom backend *optional*

### 💻 Frontend Build
- [ ] Pages: home, dashboard, profile, 404 **required**
- [ ] API calls via React Query / SWR / fetch **required**
- [ ] Form validation: Zod + react-hook-form **required**
- [ ] Toast notifications: sonner or react-hot-toast **required**
- [ ] Framer Motion (animations) *optional*
- [ ] Radix UI / Headless UI *optional*
- [ ] `npm run build` — must pass **required**

### 🗄️ Database
- [ ] Supabase: Row Level Security (RLS) policies **required**
- [ ] Create indexes on queried columns **required**
- [ ] Prisma ORM (if adding custom API) *optional*

### 💳 Payments
- [ ] Stripe: create account, get test keys *optional*
- [ ] Stripe Checkout or Stripe Elements *optional*
- [ ] Webhook: `stripe listen --forward-to localhost` *optional*
- [ ] Alt: Paddle / Dodo Payments / LemonSqueezy *optional*
- [ ] Alt: PayPal SDK *optional*

---

## Part 3 — Quality & Third-Party *(Monitoring, storage, email)*

### 📁 File Storage
- [ ] Supabase Storage (images, docs) — free 1GB **required**
- [ ] Cloudinary (image transforms, CDN) *optional*
- [ ] Uploadthing (easy file uploads) *optional*
- [ ] AWS S3 + CloudFront *optional*

### 📧 Email
- [ ] Resend (free 3k/mo) or SendGrid **required**
- [ ] Transactional emails: welcome, reset, receipt **required**
- [ ] Loops / Mailchimp (marketing) *optional*

### 📊 Monitoring & Logs
- [ ] Sentry (free tier): error tracking **required**
- [ ] Vercel Analytics (free): page views, vitals **required**
- [ ] PostHog (events, funnels, replays) *optional*
- [ ] Logflare / Axiom for log drain *optional*

### 🧪 Testing
- [ ] Vitest: unit tests for utils + logic **required**
- [ ] React Testing Library: component tests **required**
- [ ] Playwright E2E (critical flows) *optional*
- [ ] `npm run test` — all pass before deploy **required**

---

## Part 4 — Deploy & Launch *(CI/CD, SEO, compliance)*

### 🚀 CI/CD
- [ ] Vercel: connect GitHub repo, auto-deploy on push **required**
- [ ] Preview deployments per PR **required**
- [ ] GitHub Actions: lint + test on PR **required**
- [ ] Railway / Render (if Node backend) *optional*

### 🌐 DNS & CDN
- [ ] Buy domain (Namecheap / Cloudflare) **required**
- [ ] Point DNS to Vercel **required**
- [ ] SSL auto-provisioned by Vercel **required**
- [ ] Cloudflare CDN in front (DDoS, cache) *optional*

### 🔒 Security & Compliance
- [ ] HTTPS only — enforce redirect **required**
- [ ] Content Security Policy headers **required**
- [ ] Privacy policy page (required by law) **required**
- [ ] Terms of service page **required**
- [ ] Cookie consent banner (GDPR if EU) **required**
- [ ] CORS: allowlist your domains in Supabase **required**
- [ ] Rate limiting (Upstash Ratelimit) *optional*

### 🔍 SEO
- [ ] Next.js Metadata API (title, description, OG) **required**
- [ ] sitemap.xml + robots.txt **required**
- [ ] next-seo library *optional*
- [ ] Structured data (JSON-LD) *optional*

### 📱 Mobile
- [ ] React Native + Expo (cross-platform app) *optional*
- [ ] Capacitor (wrap web app) *optional*
- [ ] PWA (next-pwa manifest) *optional*

---
---

# 🔵 TIER 2: Supabase / Firebase Stack
> Production BaaS. Realtime, edge functions, auth, storage all-in-one.
> **6–12 weeks · $25–$500/mo · 1–3 devs**

---

## Part 1 — Architecture & Design *(Schema-first, roles first)*

### 🏗️ Architecture Decisions
- [ ] Define user roles (admin / user / provider / guest) **required**
- [ ] Draw ERD: tables, relations, FK constraints **required**
- [ ] Decide: Supabase vs Firebase (Firestore=noSQL, Supabase=Postgres) **required**
- [ ] Plan realtime needs (chat, notifications, live data) **required**
- [ ] Multi-tenancy (org/workspace model) *optional*

### 🎨 Design System
- [ ] Figma: full component library (atoms → organisms) **required**
- [ ] Design token export to CSS vars / Tailwind config **required**
- [ ] Dark mode design variants **required**
- [ ] Storybook component docs *optional*

### ⚙️ Project Setup
- [ ] Monorepo: Turborepo (web + app + shared pkg) *optional*
- [ ] Or: single Next.js app (simpler to start) **required**
- [ ] pnpm workspaces setup **required**
- [ ] TypeScript strict mode enabled **required**
- [ ] ESLint + Prettier + Husky pre-commit hooks **required**
- [ ] `npm run lint && npm run build` — pipeline step **required**

---

## Part 2 — Backend & Data *(Supabase config, RLS, Edge Functions)*

### 🗄️ Database (Supabase)
- [ ] Tables: users, profiles, [domain tables] **required**
- [ ] RLS policy for every table (never skip!) **required**
- [ ] DB migrations via Supabase CLI (`supabase db diff`) **required**
- [ ] Seed data for local dev **required**
- [ ] Generated TypeScript types (`supabase gen types`) **required**
- [ ] pg_cron for scheduled jobs *optional*
- [ ] pgvector for AI/search features *optional*

### ⚡ Edge Functions / Backend
- [ ] Supabase Edge Functions (Deno) for webhooks, stripe **required**
- [ ] Or: Next.js API routes (App Router route handlers) **required**
- [ ] Or: separate Node.js + Express / Fastify API *optional*
- [ ] Zod schema validation on all API inputs **required**
- [ ] Error handling middleware **required**
- [ ] tRPC (end-to-end type-safe API) *optional*
- [ ] GraphQL with Pothos / Hasura *optional*

### 🔄 Realtime
- [ ] Supabase Realtime: subscribe to table changes **required**
- [ ] Presence (show online users) *optional*
- [ ] Broadcast (push notifications via websocket) *optional*
- [ ] Ably / Pusher (more scalable) *optional*

### 💾 Cache Layer
- [ ] Upstash Redis (serverless Redis, pay-per-request) **required**
- [ ] Cache: session data, rate limits, API responses **required**
- [ ] TTL strategy per data type **required**
- [ ] Vercel KV (built-in Redis) *optional*

---

## Part 3 — Third-Party Integrations *(All the services that cost money)*

### 💳 Payments
- [ ] Stripe: products, prices, subscriptions **required**
- [ ] Stripe Customer Portal (self-serve billing) **required**
- [ ] Webhook: `/api/stripe/webhook` handler **required**
- [ ] Test all scenarios: upgrade, downgrade, cancel, refund **required**
- [ ] Paddle (handles global VAT/tax) *optional*
- [ ] Dodo Payments (emerging markets) *optional*
- [ ] PayPal SDK / Braintree *optional*
- [ ] Razorpay (India focus) *optional*
- [ ] Xendit (SEA markets) *optional*
- [ ] Midtrans (Indonesia) *optional*
- [ ] 2C2P (Thailand / Malaysia) *optional*

### 🔍 Search
- [ ] Supabase Full Text Search (pg_trgm) — free **required**
- [ ] Elasticsearch / OpenSearch (complex queries) *optional*
- [ ] Algolia (hosted, great UX) *optional*
- [ ] Typesense (self-host, affordable) *optional*
- [ ] Meilisearch (open source) *optional*

### 📁 Storage & Media
- [ ] Supabase Storage with bucket policies **required**
- [ ] Cloudinary (transforms, crop, resize) *optional*
- [ ] ImageKit (alternative to Cloudinary) *optional*
- [ ] AWS S3 + CloudFront CDN *optional*
- [ ] Bunny.net CDN (cheap video/file CDN) *optional*

### 📧 Email & Notifications
- [ ] Resend (transactional) + React Email templates **required**
- [ ] Brevo / Mailchimp (marketing campaigns) *optional*
- [ ] OneSignal (push notifications — web/mobile) *optional*
- [ ] Twilio (SMS, WhatsApp) *optional*

### 🤖 AI / ML
- [ ] OpenAI API (GPT-4, embeddings) *optional*
- [ ] Anthropic Claude API *optional*
- [ ] Vercel AI SDK (streaming, hooks) *optional*
- [ ] LangChain / LlamaIndex (RAG) *optional*

---

## Part 4 — Ops, Security, Performance *(Before you call it production)*

### 📊 Monitoring & Observability
- [ ] Sentry: errors + performance tracing **required**
- [ ] Winston (Node.js) or Pino logger **required**
- [ ] Logflare / Axiom: log aggregation **required**
- [ ] Supabase Dashboard: DB metrics, slow queries **required**
- [ ] Uptime monitor: BetterUptime / UptimeRobot **required**
- [ ] Datadog / New Relic (full APM) *optional*
- [ ] Grafana + Prometheus (self-hosted) *optional*

### 🔒 Security
- [ ] All secrets in `.env` — never committed **required**
- [ ] Doppler / Vault for secrets management **required**
- [ ] OWASP top 10 checklist **required**
- [ ] Input sanitization + SQL injection prevention **required**
- [ ] Rate limiting: Upstash Ratelimit **required**
- [ ] CORS config: allowlist origins only **required**
- [ ] helmet.js (Node.js HTTP security headers) **required**
- [ ] Privacy policy, ToS, cookie consent **required**
- [ ] GDPR: data deletion endpoint **required**
- [ ] Snyk / Dependabot (dependency scan) *optional*

### ⚡ Performance
- [ ] Lighthouse score >85 (`npx lighthouse`) **required**
- [ ] Core Web Vitals: LCP <2.5s, CLS <0.1, INP <200ms **required**
- [ ] Image optimization: next/image or sharp **required**
- [ ] `npm run build` (Next.js shows bundle size) **required**
- [ ] @next/bundle-analyzer *optional*
- [ ] Lazy load heavy components (dynamic import) **required**
- [ ] DB: explain analyze on slow queries **required**

### 🔄 CI/CD
- [ ] GitHub Actions: lint → test → build → deploy **required**
- [ ] Vercel: auto-deploy on main push **required**
- [ ] Preview URL per pull request **required**
- [ ] Supabase CLI: migration check in CI **required**
- [ ] Playwright E2E in CI *optional*
- [ ] Chromatic (visual regression Storybook) *optional*

### 🧪 Testing
- [ ] Unit: Vitest (utils, hooks, business logic) **required**
- [ ] Integration: supertest (API routes) **required**
- [ ] E2E: Playwright (signup, pay, core flow) **required**
- [ ] `npm run test:coverage` — target >70% **required**
- [ ] MSW (mock service worker for API mocking) *optional*
- [ ] Storybook interaction tests *optional*

---
---

# 🟠 TIER 3: From Scratch (ServiceFinder Pattern)
> Full custom stack. Your API, your DB, your infra. Maximum control.
> **3–6 months · $100–$2k/mo · 2–5 devs**

---

## Part 1 — Architecture & Infrastructure Design *(Design before code)*

### 🏗️ System Design
- [ ] Architecture diagram: services, data flow, auth flow **required**
- [ ] Choose API style: REST / GraphQL / tRPC / gRPC **required**
- [ ] Decide: monolith or microservices (start monolith!) **required**
- [ ] DB choice: PostgreSQL (recommended) / MySQL / MongoDB **required**
- [ ] Cache strategy: Redis (sessions, hot data, queues) **required**
- [ ] Message queue: BullMQ / RabbitMQ (async jobs) **required**
- [ ] Event-driven (Kafka for high throughput) *optional*

### 🎨 Frontend Architecture
- [ ] Next.js App Router (SSR+RSC) — recommended **required**
- [ ] Or: Remix / SvelteKit / Nuxt 3 *optional*
- [ ] State: Zustand / Jotai (global) + React Query (server) **required**
- [ ] Design system: custom Tailwind tokens **required**
- [ ] Storybook for component isolation *optional*
- [ ] Nx / Turborepo monorepo *optional*

### ⚙️ Backend Framework
- [ ] Node.js + Fastify (fast, schema-first) — recommended **required**
- [ ] Or: Node.js + Express / Hono / NestJS *optional*
- [ ] Or: Python + FastAPI / Django *optional*
- [ ] Or: Go + Gin / Fiber (high performance) *optional*
- [ ] Or: Elixir + Phoenix (realtime specialist) *optional*
- [ ] ORM: Drizzle (TS-first) or Prisma or Kysely **required**
- [ ] Input validation: Zod (TS) or Pydantic (Python) **required**

---

## Part 2 — Backend & Data Layer *(API, DB, auth from scratch)*

### 🔐 Authentication (Custom)
- [ ] JWT: access token (15min) + refresh token (7d) **required**
- [ ] Bcrypt password hashing (rounds: 12) **required**
- [ ] OAuth 2.0: Google, GitHub providers **required**
- [ ] Refresh token rotation + revocation **required**
- [ ] 2FA: TOTP (speakeasy / otplib) **required**
- [ ] Passkey / WebAuthn (Simplewebauthn) *optional*

### 🗄️ Database
- [ ] PostgreSQL: schema + migrations (Drizzle/Prisma) **required**
- [ ] Indexes on all FK, search, sort columns **required**
- [ ] Connection pooling: PgBouncer or Prisma Accelerate **required**
- [ ] Read replicas for heavy read loads **required**
- [ ] Backup: daily automated + point-in-time recovery **required**
- [ ] Neon DB (serverless Postgres, branching) *optional*
- [ ] TimescaleDB (time-series data) *optional*

### 💾 Cache & Queues
- [ ] Redis (Upstash or self-hosted): session, cache, pub/sub **required**
- [ ] BullMQ: email queue, image resize, exports **required**
- [ ] Job dashboard: Bull Board or Arena **required**
- [ ] Dead letter queue + retry logic **required**
- [ ] Kafka (Confluent) for event streaming *optional*

### 🔍 Search
- [ ] Postgres FTS + pg_trgm for basic search **required**
- [ ] Elasticsearch (self-hosted or Elastic Cloud) *optional*
- [ ] OpenSearch (AWS managed) *optional*
- [ ] Meilisearch (easier self-hosted) *optional*
- [ ] Algolia (hosted, instant search UI) *optional*
- [ ] Typesense (open source, fast) *optional*

---

## Part 3 — Third-Party & Integrations *(Payments, media, email, monitoring)*

### 💳 Payments
- [ ] Stripe: full integration (one-time + subscriptions) **required**
- [ ] Stripe Connect (marketplace, split payments) *optional*
- [ ] PayPal REST SDK *optional*
- [ ] Paddle (EU VAT compliant) *optional*
- [ ] Dodo Payments / Flutterwave (Africa/Asia) *optional*
- [ ] Razorpay / PhonePe (India) *optional*
- [ ] Xendit (SEA markets) *optional*
- [ ] Midtrans (Indonesia) *optional*
- [ ] 2C2P (Thailand/Malaysia) *optional*

### 📁 Media & CDN
- [ ] AWS S3 (or Cloudflare R2 — cheaper): file storage **required**
- [ ] CloudFront CDN (or Cloudflare) for assets **required**
- [ ] Cloudinary or Sharp (Node): image transforms **required**
- [ ] Mux / Cloudflare Stream (video hosting) *optional*
- [ ] Bunny.net (affordable CDN + storage) *optional*

### 📧 Email
- [ ] Resend or Postmark (transactional) **required**
- [ ] React Email or MJML for templates **required**
- [ ] Loops (lifecycle + marketing) *optional*
- [ ] Customer.io / Brevo *optional*
- [ ] Twilio SMS / WhatsApp Business *optional*

### 📊 Monitoring (Required for Scratch)
- [ ] Sentry: backend + frontend error tracking **required**
- [ ] Winston or Pino: structured JSON logging **required**
- [ ] Logflare / Axiom / Betterstack: log aggregation **required**
- [ ] Prometheus + Grafana: metrics dashboards **required**
- [ ] OpenTelemetry: distributed tracing **required**
- [ ] PagerDuty / Opsgenie: on-call alerting **required**
- [ ] Datadog (all-in-one APM, expensive) *optional*
- [ ] New Relic *optional*

---

## Part 4 — DevOps, Security, Testing *(Production hardening)*

### 🚀 CI/CD & Deploy
- [ ] Docker: Dockerfile + docker-compose.yml **required**
- [ ] GitHub Actions: test → build → push image → deploy **required**
- [ ] Railway / Fly.io (easy) or AWS ECS / GCP Cloud Run **required**
- [ ] Environment promotion: dev → staging → prod **required**
- [ ] Zero-downtime deploy (rolling update) **required**
- [ ] Kubernetes (k8s) — only if scaling needs it *optional*
- [ ] Terraform / Pulumi (IaC) *optional*

### 🔒 Security Hardening
- [ ] HTTPS everywhere, HSTS header **required**
- [ ] helmet.js + CSP policy **required**
- [ ] SQL injection: use ORM, never string concat **required**
- [ ] XSS: sanitize HTML output (DOMPurify) **required**
- [ ] CSRF: tokens or SameSite cookie + origin check **required**
- [ ] Rate limiting: per-user + per-IP (Upstash / nginx) **required**
- [ ] Secrets: Doppler / AWS Secrets Manager **required**
- [ ] Dependency scan: Snyk or `npm audit` weekly **required**
- [ ] Privacy policy, ToS, GDPR data deletion **required**
- [ ] Cookie consent (EU required) **required**
- [ ] Penetration test (pre-launch) *optional*
- [ ] SOC 2 compliance (enterprise) *optional*

### ⚡ Performance
- [ ] `npm run build` → check bundle size **required**
- [ ] `npx lighthouse` — target 90+ **required**
- [ ] k6 or Artillery: load test (1k concurrent users) **required**
- [ ] DB: `EXPLAIN ANALYZE` all slow queries **required**
- [ ] APM: trace slow API endpoints **required**
- [ ] CDN: cache static assets 1yr, API 0-60s **required**

### 🧪 Testing Pyramid
- [ ] Unit (Vitest/Jest): 60% coverage minimum **required**
- [ ] Integration (supertest): all API routes **required**
- [ ] E2E (Playwright): top 5 critical user flows **required**
- [ ] Contract tests: API schema validation **required**
- [ ] `npm run test:all` — must pass in CI **required**
- [ ] k6 performance regression tests *optional*
- [ ] Storybook visual regression (Chromatic) *optional*

---
---

# 🔴 TIER 4: Enterprise
> Multi-tenant SaaS, compliance, full DevOps, SLA 99.9%+. Needs a proper team.
> **6–18 months · $2k–$50k/mo · 5–50 devs**

---

## Part 1 — Platform Design & Governance *(Multi-team, contracts first)*

### 🏛️ Architecture
- [ ] Domain-driven design (DDD): bounded contexts **required**
- [ ] Microservices or modular monolith decision **required**
- [ ] API Gateway: Kong / AWS API Gateway / Traefik **required**
- [ ] Service mesh: Istio / Linkerd (mTLS, observability) *optional*
- [ ] gRPC for internal service communication **required**
- [ ] Event sourcing + CQRS (if audit trail needed) *optional*
- [ ] ADR (Architecture Decision Records) **required**

### 👥 Multi-Tenancy
- [ ] Tenant isolation strategy: schema-per-tenant or RLS **required**
- [ ] Tenant onboarding automation **required**
- [ ] Tenant-level billing + usage metering **required**
- [ ] White-label / custom domain per tenant *optional*
- [ ] SAML SSO / OIDC (enterprise login) **required**

### 🔐 Identity & Access (IAM)
- [ ] Auth0 or WorkOS (enterprise SSO, SCIM) **required**
- [ ] Or: Keycloak (self-hosted, free) *optional*
- [ ] RBAC: roles + permissions matrix **required**
- [ ] Attribute-based access control (ABAC) if complex *optional*
- [ ] Audit log: every user action stored **required**
- [ ] MFA enforced for all admin users **required**

---

## Part 2 — Infrastructure & Data Platform *(Cloud-native, HA, multi-region)*

### ☁️ Cloud Infra
- [ ] IaC: Terraform / Pulumi / CDK **required**
- [ ] Kubernetes (EKS / GKE / AKS) **required**
- [ ] Helm charts for service deployment **required**
- [ ] Multi-AZ or multi-region setup **required**
- [ ] Autoscaling: HPA + cluster autoscaler **required**
- [ ] Service mesh for mTLS between services *optional*
- [ ] GitOps: ArgoCD or Flux **required**

### 🗄️ Data Platform
- [ ] Primary: PostgreSQL cluster (AWS Aurora / Google AlloyDB) **required**
- [ ] Read replicas in each region **required**
- [ ] Redis Cluster (ElastiCache / Redis Cloud) **required**
- [ ] Data warehouse: Snowflake / BigQuery / Redshift **required**
- [ ] ETL / ELT: Airbyte / Fivetran → dbt transformations **required**
- [ ] Kafka (Confluent Cloud) for event streaming **required**
- [ ] Elasticsearch cluster for search *optional*
- [ ] ClickHouse for analytics *optional*

### 🌐 Network & CDN
- [ ] Cloudflare Enterprise (WAF, DDoS, zero trust) **required**
- [ ] AWS CloudFront or Fastly for global CDN **required**
- [ ] VPC + private subnets for all DBs **required**
- [ ] VPN / bastion host for DB access **required**
- [ ] PrivateLink for inter-service (no public internet) **required**

---

## Part 3 — Observability & Compliance *(SLA, SLO, legal, security)*

### 📊 Observability Stack
- [ ] Datadog or Dynatrace: full APM + logs + traces **required**
- [ ] Or: Prometheus + Grafana + Loki + Tempo (LGTM) *optional*
- [ ] OpenTelemetry SDK in all services **required**
- [ ] SLO dashboards: availability, latency, error rate **required**
- [ ] PagerDuty: incident routing + escalation **required**
- [ ] Runbooks for every alert **required**
- [ ] Chaos engineering: Gremlin / LitmusChaos *optional*

### 🔒 Security & Compliance
- [ ] SOC 2 Type II audit **required**
- [ ] ISO 27001 (if EU enterprise clients) *optional*
- [ ] GDPR: DPA, data map, deletion pipeline **required**
- [ ] HIPAA (if health data) *optional*
- [ ] PCI-DSS Level 1 (if storing card data) *optional*
- [ ] Penetration test (annual) **required**
- [ ] SAST/DAST: Snyk + OWASP ZAP in CI **required**
- [ ] Secrets: HashiCorp Vault or AWS Secrets Manager **required**
- [ ] Zero-trust network: Cloudflare Access / Tailscale **required**

### 📋 Legal & Compliance Pages
- [ ] Privacy policy (GDPR + CCPA compliant) **required**
- [ ] Terms of service + SLA document **required**
- [ ] Cookie consent (OneTrust / Cookiebot) **required**
- [ ] Data Processing Agreement (DPA) **required**
- [ ] Bug bounty program (HackerOne / Bugcrowd) *optional*
- [ ] VPAT / accessibility audit (WCAG 2.1 AA) **required**

---

## Part 4 — Team Processes & Delivery *(DevEx, CI/CD, release management)*

### 🔄 Advanced CI/CD
- [ ] GitHub Actions + ArgoCD: full GitOps pipeline **required**
- [ ] Blue/green or canary deployments **required**
- [ ] Feature flags: LaunchDarkly / Unleash / Flagsmith **required**
- [ ] Automated rollback on error rate spike **required**
- [ ] Database migrations with zero downtime **required**
- [ ] Release train schedule (bi-weekly) **required**
- [ ] Self-hosted GitHub Actions runners *optional*

### 🧪 Testing at Scale
- [ ] Unit tests: >80% coverage enforced in CI **required**
- [ ] Contract testing: Pact (consumer-driven) **required**
- [ ] E2E: Playwright in parallel (sharding) **required**
- [ ] Load testing: k6 Cloud (10k+ concurrent) **required**
- [ ] Visual regression: Chromatic or Percy **required**
- [ ] Synthetic monitoring: Checkly (prod uptime) **required**
- [ ] Cypress (legacy if already using it) *optional*

### 🤖 Developer Experience
- [ ] Internal dev portal: Backstage *optional*
- [ ] API docs: OpenAPI + Swagger UI or Scalar **required**
- [ ] Changelogs: automated (conventional commits) **required**
- [ ] On-call rotation + incident post-mortems **required**
- [ ] Architecture decision records (ADRs) **required**
- [ ] AI coding assistant (GitHub Copilot / Cursor) *optional*

---

---

## 💰 Full Cost Breakdown

| Service | MVP | Supabase | From Scratch | Enterprise |
|---------|-----|----------|-------------|------------|
| Hosting | Vercel Free | Vercel Free/$20 | VPS $20–$80/mo | AWS/GCP $500+/mo |
| Database | Supabase Free | Supabase $25/mo | PostgreSQL (VPS) | Aurora $200+/mo |
| Cache | – | Upstash Free | Redis (VPS) | ElastiCache $100+/mo |
| Auth | Supabase Free | Supabase Free | Custom (free) | Auth0 $250+/mo |
| Storage | Supabase 1GB | Supabase/S3 | Cloudflare R2 | S3 $50+/mo |
| Email | Resend 3k/mo | Resend Free | Resend/Postmark | $50+/mo |
| Error tracking | Sentry Free | Sentry Free | Sentry Free | Sentry $26+/mo |
| Uptime monitor | UptimeRobot Free | UptimeRobot Free | UptimeRobot Free | PagerDuty $200+/mo |
| CDN | Cloudflare Free | Cloudflare Free | Cloudflare Free | Cloudflare Enterprise |
| Payments | Stripe 2.9%+$0.30 | Stripe 2.9%+$0.30 | Stripe 2.9%+$0.30 | Negotiated rates |
| Apple Dev | $99/yr | $99/yr | $99/yr | $99/yr |
| Google Play | $25 once | $25 once | $25 once | $25 once |
| **Total/mo** | **~$10–25** | **~$50–150** | **~$100–300** | **$2k–50k** |

---

## ⏱️ Time Estimates by Role

| Role/Phase | Part 1 | Part 2 | Part 3 | Part 4 |
|-----------|--------|--------|--------|--------|
| Solo dev (MVP) | 1 wk | 3–4 wk | 1–2 wk | 1 wk |
| Solo dev (Scratch) | 2–3 wk | 6–8 wk | 2–3 wk | 2–3 wk |
| 2-person team | 1 wk | 3–4 wk | 1–2 wk | 1–2 wk |
| 5-person team | 3–5 days | 2–3 wk | 1 wk | 1 wk |

---

## 🎓 What to Learn Next

### Web Development Path
1. JavaScript fundamentals → TypeScript → React → Next.js  
2. HTTP, REST, GraphQL (how APIs work)  
3. SQL + Database design (PostgreSQL, indexing)  
4. DevOps basics (Linux, SSH, Nginx, Docker)  
5. Cloud basics (AWS/GCP fundamentals, S3, EC2)  

### Mobile Development Path
1. React Native fundamentals → Expo ecosystem  
2. State management (Zustand, Redux Toolkit, React Query)  
3. Navigation (Expo Router / React Navigation)  
4. Platform guidelines (Apple HIG + Material Design)  
5. App store process (publishing, reviews, updates)  

---

*You are currently at Tier 3 (From Scratch), at the junction of Part 2 → Part 3.*  
*Ship the core → harden with Part 3 → grow with Part 4.*

---
---

# 🔶 EXTENDED SECTIONS — Soon & Later
> Everything below is real, production-grade work that any serious app eventually needs.  
> Use this as a research & prompt reference. Nothing here is wasted knowledge.

---

## 📱 A. Mobile App (Expo / React Native) — Deep Dive

### A1. App Configuration `soon`
- [ ] Deep linking setup (`yourapp://booking/123` → opens correct screen) `soon`
- [ ] Universal Links (iOS) + App Links (Android) for web → app handoff `soon`
- [ ] App scheme defined in `app.json` under `scheme` `soon`
- [ ] Splash screen + app icon (all sizes generated) `soon`
- [ ] Adaptive icon for Android (foreground + background layer) `soon`
- [ ] Dark mode support (`useColorScheme()` + theme context) `soon`
- [ ] Force-update prompt when breaking API changes ship `soon`
- [ ] App version bump automation in CI (`eas build`) `later`

### A2. Device Features `soon`
- [ ] Biometric auth: Face ID / Touch ID (`expo-local-authentication`) `soon`
- [ ] Camera access for profile photo upload `soon`
- [ ] Location permissions (precise vs approximate) `soon`
- [ ] Background location (for real-time tracking features) `later`
- [ ] Contacts access (for inviting friends) `later`
- [ ] Calendar integration (add booking to calendar) `later`
- [ ] Haptic feedback on button presses (`expo-haptics`) `soon`

### A3. Offline & Storage `soon`
- [ ] Local data persistence: MMKV (fast) or AsyncStorage `soon`
- [ ] Offline mode: queue actions when no internet, sync when back `soon`
- [ ] Optimistic UI updates (show change immediately, rollback on fail) `soon`
- [ ] Cache API responses locally (React Query `staleTime` + `gcTime`) `soon`
- [ ] SQLite for complex offline data (`expo-sqlite`) `later`

### A4. Notifications (Full Setup) `soon`
- [ ] APNs certificate setup (iOS push — requires Apple Dev account) `soon`
- [ ] FCM setup (Android push — requires Google project) `soon`
- [ ] Expo Push Token: get on first launch, save to DB with user `soon`
- [ ] Notification permissions request with explanation dialog `soon`
- [ ] Handle notification tap → navigate to correct screen `soon`
- [ ] Notification preferences page (user toggles each type on/off) `soon`
- [ ] Scheduled notifications (reminder 1hr before appointment) `later`
- [ ] Rich notifications (image + action buttons on iOS) `later`
- [ ] Silent push (background data sync) `later`
- [ ] OneSignal / Expo Notifications / Firebase Cloud Messaging (FCM) `soon`

### A5. App Store Optimization (ASO) `soon`
- [ ] App name: include keyword (e.g., "ServiceFinder — Book Home Services") `soon`
- [ ] Short description (80 chars): hook + keyword `soon`
- [ ] Long description: benefits-first, not features-first `soon`
- [ ] Screenshots: annotated, show value not just UI (all device sizes) `soon`
- [ ] Preview video (30 sec): autoplay in store listing `later`
- [ ] Keywords field (Apple — 100 chars max, comma separated) `soon`
- [ ] Ratings prompt: `expo-store-review` at right moment (after success) `soon`
- [ ] Respond to every App Store review (boosts ranking) `soon`
- [ ] Localized store listings (different language = separate listing) `later`

### A6. Beta Testing `soon`
- [ ] TestFlight (iOS): internal testing → external beta `soon`
- [ ] Google Play Internal Testing Track → Closed Testing → Production `soon`
- [ ] EAS Update channels: `development` / `staging` / `production` `soon`
- [ ] Expo Dev Client: custom native build for testing native modules `later`

---

## 🏪 B. Marketplace-Specific Features

### B1. Trust & Safety `soon`
- [ ] Provider identity verification: Stripe Identity / Jumio / Onfido `soon`
- [ ] Document upload: business license, insurance certificate `soon`
- [ ] Background checks for workers/staff: Checkr API `later`
- [ ] Manual verification workflow: admin reviews + approves provider `soon`
- [ ] Verified badge shown on provider profile `soon`
- [ ] Report button on every provider/listing `soon`
- [ ] Content moderation queue in admin panel `soon`
- [ ] Automated spam detection (rate of reports per provider) `later`
- [ ] Phone number verification (OTP via SMS) `soon`
- [ ] Email verification before booking allowed `soon`

### B2. Payments & Money Flow `soon`
- [ ] Escrow system: hold customer payment until job marked complete `soon`
- [ ] Stripe Connect: marketplace split payments (you take platform fee automatically) `soon`
- [ ] Payout schedule: weekly / bi-weekly to provider bank account `soon`
- [ ] Instant payout option (Stripe Instant Payouts, extra fee) `later`
- [ ] Stripe Connect onboarding flow for providers (bank account setup) `soon`
- [ ] Platform fee configuration: admin sets % per category `soon`
- [ ] Refund policy enforcement: auto-refund within 24h, manual after `soon`
- [ ] Partial refunds (if job partially completed) `later`
- [ ] Dispute resolution: customer claims → hold payout → admin decides `soon`
- [ ] Stripe Radar: fraud detection rules `soon`
- [ ] Chargeback handling process (documentation + response templates) `soon`
- [ ] Idempotency keys on all payment endpoints (prevent double charges) `soon`
- [ ] Invoice PDF generation for every completed booking `soon`
- [ ] Receipt email with itemized breakdown `soon`

### B3. Tax & Finance `later`
- [ ] 1099-K reporting for contractors earning >$600/yr (US) `later`
- [ ] GST/VAT invoice generation (AU, EU, SG, MY) `later`
- [ ] Withholding tax logic per country `later`
- [ ] Annual earnings statement for providers `later`
- [ ] Financial reconciliation: Stripe payouts vs DB records `soon`
- [ ] Revenue recognition rules (when is revenue "earned"?) `soon`
- [ ] Tax rate configuration per jurisdiction in admin `later`

### B4. Booking Flow (Complete) `soon`
- [ ] Real-time availability calendar for providers `soon`
- [ ] Time slot booking with buffer time between bookings `soon`
- [ ] Booking confirmation → email + push notification `soon`
- [ ] Booking reminder: 24h before + 1h before `soon`
- [ ] Cancellation flow: enforce policy (free cancel >24h, fee <24h) `soon`
- [ ] Reschedule functionality `soon`
- [ ] Recurring bookings (weekly/monthly service) `later`
- [ ] Group bookings (multiple services in one order) `later`
- [ ] Waitlist (if provider is fully booked) `later`
- [ ] Booking notes (customer leaves instructions for provider) `soon`
- [ ] Post-job checklist (provider marks tasks complete) `later`
- [ ] Photo evidence upload (before/after for cleaning, repair jobs) `later`

### B5. Reviews & Reputation `soon`
- [ ] Review prompt: appears 24h after job marked complete `soon`
- [ ] Two-way reviews: customer reviews provider AND provider reviews customer `later`
- [ ] Review moderation: flag abusive reviews `soon`
- [ ] Response to review (provider can reply) `later`
- [ ] Review incentive: discount on next booking for leaving review `later`
- [ ] Aggregate rating display: star average + breakdown per category `soon`
- [ ] Fake review detection (flag if reviewer never actually booked) `soon`

### B6. Provider Tools `soon`
- [ ] Provider onboarding wizard (step-by-step setup guide) `soon`
- [ ] Service catalog management (add/edit/pause services) `soon`
- [ ] Pricing management: base price + add-on options `soon`
- [ ] Availability calendar: block personal time off `soon`
- [ ] Coverage area map (draw service radius on Google Maps) `soon`
- [ ] Staff management: assign bookings to team members `soon`
- [ ] Earnings dashboard: total, pending, paid, this month `soon`
- [ ] Performance metrics: response rate, completion rate, avg rating `soon`
- [ ] Lead response SLA tracker (reply within 1hr = higher ranking) `later`
- [ ] Custom booking page URL (`servicefinder.xyz/book/company-name`) `later`
- [ ] Embed widget (providers embed booking button on their own site) `later`

---

## 🛡️ C. Security — Deep Dive

### C1. API Security `soon`
- [ ] API versioning: `/api/v1/`, `/api/v2/` (never break old app versions) `soon`
- [ ] Graceful shutdown handler (SIGTERM → drain requests → stop) `soon`
- [ ] Request ID header (`X-Request-ID`) for log tracing `soon`
- [ ] Request timeout: 30s max per API call `soon`
- [ ] Response envelope: always `{ data, error, meta }` structure `soon`
- [ ] Swagger / OpenAPI spec auto-generated from NestJS decorators `soon`
- [ ] Postman / Bruno collection for all API endpoints `soon`
- [ ] API changelog (log breaking vs non-breaking changes) `later`
- [ ] API deprecation notices in headers (`Sunset: date`) `later`
- [ ] Webhook signature verification (Stripe, GitHub, etc.) `soon`
- [ ] Webhook retry idempotency (same event = same result) `soon`
- [ ] Webhook delivery log (see which events were received) `soon`

### C2. VPS / Server Hardening `soon`
- [ ] Disable root SSH login (`PermitRootLogin no`) `soon`
- [ ] SSH key-only authentication (disable password SSH) `soon`
- [ ] `fail2ban`: auto-block IPs with failed SSH attempts `soon`
- [ ] `ufw` firewall: allow only 22 (SSH), 80 (HTTP), 443 (HTTPS) `soon`
- [ ] Automatic security updates: `unattended-upgrades` `soon`
- [ ] Change default SSH port (22 → custom port) `later`
- [ ] Nginx: disable server version header (`server_tokens off`) `soon`
- [ ] Nginx: gzip compression for all responses `soon`
- [ ] Nginx: rate limit at reverse proxy level `soon`
- [ ] SSL cert auto-renewal: Certbot + cron `soon`
- [ ] Log rotation: `/etc/logrotate.d/` config for Nginx + app logs `soon`

### C3. Data & Privacy `soon`
- [ ] GDPR: "Download my data" button (data portability, required in EU) `soon`
- [ ] GDPR: data deletion pipeline (delete from all tables + queues) `soon`
- [ ] GDPR: data retention policy (auto-delete old booking data after 5yr) `later`
- [ ] CCPA: "Do Not Sell My Data" toggle (required if US users) `later`
- [ ] Cookie consent: granular (analytics opt-in separate from essential) `soon`
- [ ] Data minimization: only collect what you actually use `soon`
- [ ] PII masking in logs (never log email/phone/card in plain text) `soon`
- [ ] Data breach notification process (72hr GDPR window) `later`
- [ ] Privacy dashboard: user sees what data you hold about them `later`

### C4. Dependency & Supply Chain Security `soon`
- [ ] `npm audit` — run weekly, fix CRITICAL and HIGH `soon`
- [ ] Dependabot or Renovate: auto-PRs for dependency updates `soon`
- [ ] Snyk: deep vulnerability scan including transitive deps `soon`
- [ ] Lock file committed (`package-lock.json` or `pnpm-lock.yaml`) `soon`
- [ ] Pin Docker base image versions (not `:latest`) `soon`
- [ ] SBOM (Software Bill of Materials) for enterprise clients `later`

---

## ⚡ D. Performance — Deep Dive

### D1. Frontend Performance `soon`
- [ ] Lighthouse CI: run in GitHub Actions, fail if score drops `soon`
- [ ] Core Web Vitals monitoring in Vercel Analytics / PostHog `soon`
- [ ] Image format: serve WebP (next/image does this automatically) `soon`
- [ ] Image lazy loading: `loading="lazy"` on below-fold images `soon`
- [ ] Font optimization: `font-display: swap`, subset fonts `soon`
- [ ] Preconnect to third-party domains in `<head>` `soon`
- [ ] Dynamic imports for heavy components (code splitting) `soon`
- [ ] `@next/bundle-analyzer`: find large chunks > 100KB `soon`
- [ ] Remove unused CSS (PurgeCSS / Tailwind JIT already does this) `soon`
- [ ] Prefetch likely next routes (`<Link prefetch>`) `later`
- [ ] Service Worker: cache static assets (PWA approach) `later`
- [ ] Critical CSS inlining (above-the-fold styles inline) `later`

### D2. Backend Performance `soon`
- [ ] Response compression: gzip / brotli on all API responses `soon`
- [ ] HTTP/2 enabled on Nginx (multiplexing, much faster) `soon`
- [ ] Pagination on ALL list endpoints (never return >100 rows unbounded) `soon`
- [ ] Cursor-based pagination for infinite scroll (better than offset) `later`
- [ ] N+1 query detection: Prisma query logs in development `soon`
- [ ] Eager loading: `include` relations in single query vs multiple `soon`
- [ ] Redis cache warming on server start for hot data `later`
- [ ] Background job for heavy operations (PDF gen, email, image resize) `soon`
- [ ] Streaming responses for large data exports (CSV downloads) `later`

### D3. Mobile Performance `soon`
- [ ] FlatList vs ScrollView: use FlatList for lists >20 items `soon`
- [ ] `useMemo` / `useCallback` on expensive computations `soon`
- [ ] Image caching: `expo-image` (already using, keep it) `soon`
- [ ] Avoid re-renders: React DevTools profiler check `soon`
- [ ] Heavy screens: lazy load with `React.lazy` + Suspense `later`
- [ ] RAM usage: `pm2 monit` equivalent for React Native (Flipper) `later`
- [ ] Hermes JS engine enabled (already on — keep it) `soon`

---

## 🧪 E. Testing — Deep Dive

### E1. Unit Testing `soon`
- [ ] Test utilities and helpers (pure functions first) `soon`
- [ ] Test all custom React hooks `soon`
- [ ] Test all Zod schemas (valid + invalid inputs) `soon`
- [ ] Test business logic: booking price calculation, fee splitting `soon`
- [ ] Mocking: `vi.mock()` for API calls, external services `soon`
- [ ] Test factories: generate fake data with `@faker-js/faker` `soon`
- [ ] Coverage report: `npm run test:coverage` → check % per module `soon`
- [ ] Coverage gates in CI: fail if <60% on critical modules `later`

### E2. Integration Testing `soon`
- [ ] API integration tests: every route with valid + invalid payloads `soon`
- [ ] Auth flow tests: login, logout, token refresh, expired token `soon`
- [ ] Payment flow tests: use Stripe test mode, mock webhooks `soon`
- [ ] Database seed + teardown for each test suite `soon`
- [ ] `supertest` (Node.js) or `httpx` (Python) for HTTP testing `soon`
- [ ] MSW (Mock Service Worker): intercept and mock API calls in tests `later`

### E3. E2E Testing `soon`
- [ ] Playwright: install, configure, write first test `soon`
- [ ] Critical flows to test: signup → browse → book → pay → confirm `soon`
- [ ] Auth flows: login, logout, password reset `soon`
- [ ] Payment flow: checkout with test card → success page `soon`
- [ ] Mobile E2E: Maestro (simpler than Detox for Expo) `later`
- [ ] Visual regression: Playwright screenshots on each run `later`
- [ ] Parallel test execution (sharding) for speed `later`
- [ ] Test against staging (not production!) `soon`

### E4. Load Testing `soon`
- [ ] k6: write test script for top 3 most-used endpoints `soon`
- [ ] Artillery: alternative, easier YAML config `soon`
- [ ] Scenarios: ramp up 0 → 100 → 500 → 1000 users `soon`
- [ ] Test: with Redis cache ON vs OFF (measure improvement) `soon`
- [ ] Test: PM2 single instance vs cluster mode `soon`
- [ ] Stress test: find breaking point (what CCU causes errors?) `later`
- [ ] Soak test: 100 users for 30 minutes (memory leak detection) `later`

### E5. Accessibility Testing `later`
- [ ] axe-core: automated a11y scan on every page `later`
- [ ] Screen reader testing: VoiceOver (iOS) + TalkBack (Android) `later`
- [ ] Keyboard navigation: tab through all interactive elements `later`
- [ ] Color contrast: all text passes AA ratio (4.5:1 minimum) `later`
- [ ] ARIA labels on icons, buttons without text `later`
- [ ] Focus trap in modals (tab stays inside modal) `later`
- [ ] `eslint-plugin-jsx-a11y` in lint config `soon`

---

## 📊 F. Observability — Deep Dive

### F1. Logging Strategy `soon`
- [ ] Structured JSON logging (every log = parseable JSON object) `soon`
- [ ] Log levels: `error` (alert), `warn` (investigate), `info` (normal), `debug` (dev only) `soon`
- [ ] Request logger: log `method`, `path`, `statusCode`, `durationMs`, `userId` `soon`
- [ ] Never log: passwords, tokens, full credit card, PII `soon`
- [ ] Correlation ID: pass `X-Request-ID` through entire request chain `soon`
- [ ] Log aggregation: Axiom / BetterStack / Logflare (ship to central place) `soon`
- [ ] Log search + alerting: set alert if `error` logs > 10/min `soon`
- [ ] Log retention: 30 days hot, 1yr cold (S3 archive) `later`
- [ ] Log rotation on VPS: delete files older than 14 days `soon`

### F2. Metrics & Dashboards `soon`
- [ ] Health check endpoint `/api/health` — returns DB + Redis status `soon`
- [ ] Business metrics endpoint (admin only): GMV, active users, bookings today `soon`
- [ ] API response time p50 / p95 / p99 tracking `soon`
- [ ] Error rate per endpoint tracking `soon`
- [ ] DB query time tracking (slow query log if >500ms) `soon`
- [ ] Redis cache hit rate tracking `later`
- [ ] Grafana dashboard (if self-hosting Prometheus) `later`
- [ ] Custom Sentry dashboard: top errors this week `soon`

### F3. Alerting `soon`
- [ ] Alert: server CPU > 80% for 5 min `soon`
- [ ] Alert: server RAM > 85% `soon`
- [ ] Alert: API error rate > 5% in 5 min `soon`
- [ ] Alert: DB connection pool exhausted `soon`
- [ ] Alert: Redis memory > 80% `soon`
- [ ] Alert: disk space > 80% `soon`
- [ ] Alert: failed payment rate > 10% in 1hr `soon`
- [ ] Alert: UptimeRobot detects downtime → email + Discord/Slack `soon`
- [ ] Sentry: new issue type alert (not just high volume) `soon`
- [ ] On-call rotation: who gets woken at 3am? (even solo = just you) `later`

### F4. Incident Response `later`
- [ ] Status page: statuspage.io or BetterStack (users see outage info) `soon`
- [ ] Post-mortem template (5 Whys + timeline + action items) `later`
- [ ] Rollback runbook: step-by-step to revert a bad deploy `soon`
- [ ] DB restore runbook: test restore from backup monthly `later`
- [ ] Communication plan: what to say to users during outage `later`
- [ ] Chaos testing: kill Redis, DB, API — does app degrade gracefully? `later`

---

## 🚀 G. CI/CD — Deep Dive

### G1. GitHub Actions (Backend) `soon`
- [ ] Trigger: `on: push: branches: [main]` + `on: pull_request` `soon`
- [ ] Step: checkout + set up Node.js with cache `soon`
- [ ] Step: `npm ci` (reproducible installs) `soon`
- [ ] Step: `npm run lint` — fail on any warning `soon`
- [ ] Step: `npm run test` — fail on any test failure `soon`
- [ ] Step: `npm run build` — fail if compile error `soon`
- [ ] Step: SSH → VPS → `git pull` → `npm ci` → `prisma migrate deploy` → `pm2 reload` `soon`
- [ ] GitHub Secrets: `VPS_SSH_KEY`, `VPS_HOST`, `VPS_USER` `soon`
- [ ] Matrix strategy: test on Node 20 + 22 `later`
- [ ] Concurrency: cancel in-progress runs on new push `soon`

### G2. EAS Build (Mobile) `soon`
- [ ] Auto-trigger on push to `main` → start EAS Android + iOS build `soon`
- [ ] GitHub Secret: `EXPO_TOKEN` (from expo.dev) `soon`
- [ ] EAS secrets: inject `SENTRY_AUTH_TOKEN`, `STRIPE_PUBLIC_KEY` at build time `soon`
- [ ] Build profiles: `development` / `preview` / `production` `soon`
- [ ] Separate EAS project for each environment `later`
- [ ] Notify Slack/Discord when build succeeds/fails `later`
- [ ] Auto-submit to App Store after successful iOS build `later`
- [ ] Auto-submit to Google Play after successful Android build `later`

### G3. OTA Updates (Expo Updates) `soon`
- [ ] EAS Update configured with channels matching build profiles `soon`
- [ ] Update strategy: `fingerprintMismatch: nativeUpdate` (re-install if native changed) `soon`
- [ ] Push OTA: `eas update --channel production --message "Fix booking bug"` `soon`
- [ ] Rollback OTA: `eas update:rollback --channel production` `soon`
- [ ] OTA update visible to users within 24h (next cold start) `soon`
- [ ] Critical fix: force OTA check on launch (`Updates.checkForUpdateAsync()`) `later`

### G4. Environment Strategy `soon`
- [ ] Three environments: `development` / `staging` / `production` `soon`
- [ ] Staging = exact copy of production (real infra, fake data) `soon`
- [ ] Every deploy goes to staging first, then production `soon`
- [ ] Staging URL: `staging-api.yourdomain.com` `soon`
- [ ] DB: staging has its own separate database (never prod data) `soon`
- [ ] Stripe: staging uses test keys, prod uses live keys `soon`
- [ ] Feature flags: roll out features to 10% → 50% → 100% `later`

---

## 🗄️ H. Database — Deep Dive

### H1. Schema Design `soon`
- [ ] All tables have: `id` (UUID), `createdAt`, `updatedAt`, `deletedAt` (soft delete) `soon`
- [ ] Soft delete pattern: `deletedAt IS NULL` filter on all queries `soon`
- [ ] UUID vs autoincrement: UUID for user-facing IDs (not guessable) `soon`
- [ ] Enum types defined in Prisma (not plain strings) `soon`
- [ ] All foreign keys have ON DELETE behavior defined `soon`
- [ ] Check constraints for business rules (e.g., `price > 0`) `later`

### H2. Migrations `soon`
- [ ] Never edit existing migrations — always create new ones `soon`
- [ ] `npx prisma migrate dev` (development) `soon`
- [ ] `npx prisma migrate deploy` (production — no prompt, safe) `soon`
- [ ] Run migrations BEFORE server restart in CI/CD `soon`
- [ ] Test: migrate → rollback → migrate again (verify idempotency) `soon`
- [ ] Squash old migrations annually to keep list manageable `later`
- [ ] Zero-downtime migrations: add column → deploy → backfill → add constraint `later`

### H3. Indexing Strategy `soon`
- [ ] Primary key index (automatic) `soon`
- [ ] Foreign key indexes: every FK column `soon`
- [ ] Search columns: `name`, `email`, `status`, `category` `soon`
- [ ] Sort columns: `createdAt DESC` on most list views `soon`
- [ ] Composite indexes for combined WHERE clauses `soon`
- [ ] Partial indexes: `WHERE status = 'active'` (smaller, faster) `later`
- [ ] GIN index for full-text search columns `later`
- [ ] `EXPLAIN ANALYZE` on top 10 slowest queries `soon`
- [ ] pg_stat_statements: find slow queries automatically `later`

### H4. Backup & Recovery `soon`
- [ ] Daily automated backup cron: `pg_dump | gzip → backup dir` `soon`
- [ ] Copy backups off-server: to S3, Backblaze B2, or Google Drive `soon`
- [ ] Test restore: actually restore a backup to staging monthly `soon`
- [ ] Retention: 7 daily + 4 weekly + 12 monthly backups `soon`
- [ ] Point-in-time recovery (PITR): enable WAL archiving `later`
- [ ] Backup encryption: GPG encrypt before upload `later`

---

## 📧 I. Communications — Deep Dive

### I1. Transactional Emails (Required) `soon`
- [ ] Welcome email (after signup) `soon`
- [ ] Email verification (confirm your email) `soon`
- [ ] Password reset `soon`
- [ ] Booking confirmation (customer + provider both get one) `soon`
- [ ] Booking reminder 24h before `soon`
- [ ] Booking reminder 1h before `soon`
- [ ] Booking completed (with review prompt link) `soon`
- [ ] Payment received (to customer) `soon`
- [ ] Payout sent (to provider) `soon`
- [ ] Booking cancelled (to both) with refund info `soon`
- [ ] Account deletion confirmation `soon`

### I2. Marketing & Lifecycle Emails `later`
- [ ] Welcome drip sequence (Day 0, Day 3, Day 7) `later`
- [ ] Re-engagement: "Haven't booked in 30 days" `later`
- [ ] Win-back: "Come back, here's 10% off" `later`
- [ ] Feature announcement newsletter `later`
- [ ] Monthly digest for providers (earnings summary) `later`
- [ ] Unsubscribe link in every marketing email (CAN-SPAM / GDPR) `soon`
- [ ] Email preference center (user picks which emails to receive) `later`

### I3. In-App Notification Center `soon`
- [ ] Notification bell icon in header with unread count `soon`
- [ ] Notification list: title, time, read/unread state `soon`
- [ ] Mark all as read `soon`
- [ ] Deep link from notification to relevant screen `soon`
- [ ] Notification types: booking, message, review, payment, system `soon`
- [ ] Real-time notification delivery (WebSocket / Supabase Realtime) `soon`

### I4. SMS & WhatsApp `later`
- [ ] OTP via SMS (phone number verification) `soon`
- [ ] Booking confirmation SMS `later`
- [ ] Booking reminder SMS `later`
- [ ] WhatsApp Business API for rich messages `later`
- [ ] Twilio / Vonage / Sinch for SMS delivery `later`

---

## 🎨 J. Design System — Deep Dive

### J1. Tokens & Foundations `soon`
- [ ] Color palette: primary, secondary, error, warning, success, surface, on-surface `soon`
- [ ] Color shades: 50, 100, 200, ..., 900 for each base color `soon`
- [ ] Dark mode color map: every light color maps to a dark equivalent `soon`
- [ ] Typography: font family, size scale (xs → 5xl), weight (400/500/600/700/800) `soon`
- [ ] Spacing: 4px grid (4, 8, 12, 16, 20, 24, 32, 40, 48, 64) `soon`
- [ ] Border radius: none / sm / md / lg / xl / full `soon`
- [ ] Shadow / elevation scale: 5 levels `soon`
- [ ] Animation: duration (100/200/300ms), easing curves `later`
- [ ] Z-index scale: toast / modal / dropdown / sidebar / base `soon`

### J2. Core Components `soon`
- [ ] Button: primary / secondary / ghost / destructive / loading state `soon`
- [ ] Input: with label / error / hint / icon / clear button `soon`
- [ ] Select / Dropdown `soon`
- [ ] Checkbox + Radio `soon`
- [ ] Toggle / Switch `soon`
- [ ] Card: default / elevated / outlined `soon`
- [ ] Avatar: image + initials fallback + size variants `soon`
- [ ] Badge / Chip / Tag: multiple colors `soon`
- [ ] Modal / Bottom Sheet (mobile) `soon`
- [ ] Toast / Snackbar: success / error / warning / info `soon`
- [ ] Loading: spinner / skeleton / shimmer `soon`
- [ ] Empty state: icon + message + CTA `soon`
- [ ] Error state: icon + message + retry button `soon`
- [ ] Divider / Separator `soon`
- [ ] Progress bar / Stepper `soon`
- [ ] Tabs `soon`
- [ ] Accordion / Collapsible `soon`
- [ ] Data table with sort + filter + pagination `later`

### J3. Storybook (Component Documentation) `later`
- [ ] Install Storybook for React Native / Next.js `later`
- [ ] Write story for every component (all variants + states) `later`
- [ ] Args/Controls: demo props interactively `later`
- [ ] Chromatic: visual regression on every PR `later`
- [ ] Publish Storybook as docs site `later`

---

## 📈 K. Analytics & Product Intelligence

### K1. Product Analytics `soon`
- [ ] PostHog (recommended, open source option): install + configure `soon`
- [ ] Track: screen/page views automatically `soon`
- [ ] Track: key events (signup, first_booking, payment_complete, churn_risk) `soon`
- [ ] User identify: call `posthog.identify(userId, { email, plan })` on login `soon`
- [ ] Funnel analysis: signup → profile → first_search → first_booking `soon`
- [ ] Retention analysis: do users come back after 7 days? 30 days? `later`
- [ ] Session recording: replay user sessions to find UX problems `later`
- [ ] Heatmaps: where do users click/scroll? `later`
- [ ] NPS survey: ask "Would you recommend us?" after 3rd booking `later`

### K2. Business Intelligence `soon`
- [ ] GMV (Gross Merchandise Value) daily/weekly/monthly `soon`
- [ ] Platform revenue (your fees, not total GMV) `soon`
- [ ] MRR / ARR (if subscription model) `later`
- [ ] CAC (Customer Acquisition Cost) tracking `later`
- [ ] LTV (Lifetime Value) per customer cohort `later`
- [ ] Churn rate (monthly provider churn) `later`
- [ ] Booking conversion rate (views → bookings) `soon`
- [ ] Provider utilization (% of available slots that get booked) `later`
- [ ] Data warehouse: export to Metabase / Looker Studio for dashboards `later`

### K3. A/B Testing `later`
- [ ] Feature flags: GrowthBook (free, open source) or Statsig `later`
- [ ] Test hypothesis: "Does showing social proof increase conversion?" `later`
- [ ] Variant assignment based on user ID (consistent experience) `later`
- [ ] Statistical significance check before declaring winner `later`
- [ ] Automated rollout: if variant wins, roll to 100% `later`

---

## 🏢 L. Admin Panel — Deep Dive

### L1. User Management `soon`
- [ ] User list with search + filter by role / status / date `soon`
- [ ] User detail page: profile, activity, bookings, payments `soon`
- [ ] Suspend / unsuspend account `soon`
- [ ] Permanently delete account + all data (GDPR) `soon`
- [ ] Impersonate user (view app as them — for support) `later`
- [ ] Email user directly from admin panel `later`
- [ ] Export users to CSV `later`

### L2. Company / Provider Management `soon`
- [ ] Pending verification queue (new providers waiting for approval) `soon`
- [ ] View documents (license, insurance upload) `soon`
- [ ] Approve / reject with reason message `soon`
- [ ] Feature a company (highlighted in search) `later`
- [ ] Suspend company + notify all upcoming customers `later`
- [ ] Company performance metrics `soon`

### L3. Booking & Payment Oversight `soon`
- [ ] All bookings list with filters `soon`
- [ ] Booking detail: timeline, messages, payment status `soon`
- [ ] Manual booking status override `soon`
- [ ] Dispute queue: flag → investigate → resolve `soon`
- [ ] Manual refund trigger `soon`
- [ ] Financial report: daily / weekly / monthly CSV export `soon`
- [ ] Stripe Dashboard link per transaction `soon`

### L4. Platform Configuration `later`
- [ ] Service categories management (add / edit / reorder) `later`
- [ ] Platform fee % per category (configurable without deploy) `later`
- [ ] Promotional code creation and management `later`
- [ ] Featured banner / announcement system `later`
- [ ] Maintenance mode toggle (show "We'll be back" page) `later`
- [ ] Feature flag management UI (turn features on/off without deploy) `later`

---

## 🌍 M. Internationalization (i18n) & Localization

### M1. Setup `later`
- [ ] i18next + react-i18next (web) `later`
- [ ] expo-localization + i18next (mobile) `later`
- [ ] Translation files: `locales/en.json`, `locales/th.json`, etc. `later`
- [ ] Auto-detect user locale from device settings `later`
- [ ] Language switcher in settings `later`

### M2. Content Localization `later`
- [ ] Localize all UI strings (no hardcoded English text) `later`
- [ ] Date formats per locale (MM/DD/YYYY vs DD/MM/YYYY) `later`
- [ ] Time formats (12h vs 24h) `later`
- [ ] Currency formatting (symbol position, decimals) `later`
- [ ] Pluralization rules (1 booking vs 2 bookings vs "many") `later`
- [ ] RTL layout support for Arabic / Hebrew `later`

### M3. Translation Management `later`
- [ ] Crowdin / Lokalise: online translation platform for team/freelancers `later`
- [ ] Auto-detect untranslated strings in CI `later`
- [ ] Localized App Store listings (separate screenshots per language) `later`

---

## 🤝 N. Customer Support Infrastructure

### N1. Help Desk `soon`
- [ ] Intercom / Crisp / Zendesk: choose one `soon`
- [ ] In-app chat widget (bottom-right corner) `soon`
- [ ] Email support inbox: `support@yourdomain.com` `soon`
- [ ] Auto-reply with ticket number and expected response time `soon`
- [ ] Canned responses for top 10 common questions `soon`
- [ ] Support agents can view user's booking history in sidebar `later`

### N2. Self-Service `soon`
- [ ] FAQ page on website `soon`
- [ ] Help center / knowledge base (Notion public page is fine to start) `soon`
- [ ] In-app search: "How do I cancel a booking?" `later`
- [ ] Video tutorials for providers (Loom embeds) `later`

### N3. Status Page `soon`
- [ ] statuspage.io or BetterStack status page `soon`
- [ ] Show: API status, database status, mobile app status `soon`
- [ ] Auto-update when UptimeRobot detects downtime `soon`
- [ ] Users can subscribe to status updates `soon`
- [ ] Link status page from app's error states `soon`

---

## 🔗 O. Integrations Catalogue (Full List)

### O1. Payments
| Service | Use Case | Price |
|---------|----------|-------|
| Stripe | Primary — one-time + subscriptions | 2.9% + $0.30 |
| Stripe Connect | Marketplace split payments | Same + 0.25% |
| PayPal | US/EU alternative | 3.49% + $0.49 |
| Paddle | EU VAT/tax handling | 5% + $0.50 |
| Xendit | Philippines, Indonesia, Malaysia | ~2.5% |
| Midtrans | Indonesia focus | ~2.9% |
| Razorpay | India focus | 2% |
| 2C2P | Thailand, Malaysia | ~2.5% |
| Flutterwave | Africa | ~1.4% |
| Dodo Payments | Emerging markets | Varies |
| LemonSqueezy | Digital products only | 5% + $0.50 |

### O2. Email
| Service | Free Tier | Paid |
|---------|-----------|------|
| Resend | 3,000/mo | $20/mo (50k) |
| Postmark | 100/mo trial | $15/mo (10k) |
| SendGrid | 100/day | $19.95/mo |
| AWS SES | 62k/mo (from EC2) | $0.10/1000 |
| Mailchimp | 1,000/mo | $13/mo |
| Brevo | 300/day | $25/mo |
| Customer.io | — | $100/mo |
| Loops | 30-day trial | $49/mo |

### O3. File Storage & CDN
| Service | Free Tier | Paid |
|---------|-----------|------|
| Cloudinary | 25GB | $89/mo |
| Cloudflare R2 | 10GB | $0.015/GB |
| AWS S3 | 5GB (12mo) | $0.023/GB |
| Supabase Storage | 1GB | $0.021/GB |
| Bunny.net | — | $0.01/GB CDN |
| ImageKit | 20GB | $49/mo |
| Uploadthing | 2GB | $10/mo |

### O4. Search
| Service | Free Tier | Paid |
|---------|-----------|------|
| Postgres FTS | Included | — |
| Algolia | 10k records, 10k ops | $0.50/1k ops |
| Typesense | Self-host | $10/mo cloud |
| Meilisearch | Self-host | $35/mo cloud |
| Elasticsearch | Self-host | $95/mo cloud |
| OpenSearch | AWS managed | By usage |

### O5. Maps & Location
| Service | Free Tier | Paid |
|---------|-----------|------|
| Google Maps | $200 credit/mo | $5–7/1k loads |
| Mapbox | 50k loads/mo | $0.50/1k loads |
| HERE Maps | 250k requests/mo | $0.001+ |
| OpenStreetMap | Unlimited (no API key) | Free |

### O6. Monitoring & Observability
| Service | Free Tier | Paid |
|---------|-----------|------|
| Sentry | 5k errors/mo | $26/mo |
| PostHog | 1M events/mo | $0.000225/event |
| Datadog | 5 hosts 1 day | $15/host/mo |
| New Relic | 100GB/mo | $0.30/GB |
| Grafana Cloud | 50GB logs | $0.50/GB |
| UptimeRobot | 50 monitors | $7/mo (pro) |
| BetterStack | 10 monitors | $25/mo |
| Axiom | 500GB/mo | $25/mo |

### O7. Authentication
| Service | Free Tier | Paid |
|---------|-----------|------|
| Supabase Auth | Unlimited | Included |
| Clerk | 10k MAU | $25/mo |
| Auth0 | 7,500 MAU | $23/mo |
| WorkOS | — | $149/mo (SSO) |
| Keycloak | Self-host | Free |

### O8. AI & LLM
| Service | Free Tier | Paid |
|---------|-----------|------|
| OpenAI API | $5 credit | $0.002/1k tokens |
| Anthropic Claude | — | $0.003/1k tokens |
| Google Gemini API | 15 req/min free | Pay per use |
| Cohere | Trial | $0.40/1M tokens |
| Replicate | $0.0001/sec GPU | Pay per use |

---

## 📅 P. Suggested Implementation Order (Your Current Stack)

> Based on where you are right now (Tier 3, Part 2→3 complete)

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| 🔴 **Do Now** | Health check `/api/health` | 1h | UptimeRobot needs it |
| 🔴 **Do Now** | Privacy Policy page | 2h | Apple + Stripe require it |
| 🔴 **Do Now** | Account deletion button | 3h | Apple requires it |
| 🔴 **Do Now** | UptimeRobot setup | 30min | Know when you're down |
| 🟠 **This Week** | GitHub Actions backend CI/CD | 4h | Auto-deploy on push |
| 🟠 **This Week** | PM2 cluster mode | 1h | 2x performance |
| 🟠 **This Week** | DB indexes (status, createdAt) | 1h | 10x query speed |
| 🟠 **This Week** | Redis caching on category endpoints | 3h | Reduce DB load |
| 🟡 **This Month** | Winston log rotation | 2h | Prevent disk full crash |
| 🟡 **This Month** | Staging environment | 1 day | Safe deploys |
| 🟡 **This Month** | Sentry source maps | 2h | Readable crash reports |
| 🟡 **This Month** | OTA update channels | 2h | Instant bug fixes |
| 🔵 **Next Month** | Stripe Connect (provider payouts) | 1 week | Core marketplace feature |
| 🔵 **Next Month** | Escrow payment flow | 1 week | Trust & safety |
| 🔵 **Next Month** | Provider verification workflow | 3 days | Trust & safety |
| 🔵 **Next Month** | Booking calendar / availability | 1 week | Core feature |
| ⬜ **Later** | KYC / background checks | 2 weeks | When real providers join |
| ⬜ **Later** | i18n / multi-language | 1 week | When expanding markets |
| ⬜ **Later** | A/B testing infrastructure | 1 week | When optimizing growth |
| ⬜ **Later** | Enterprise compliance (SOC2) | 3 months | When B2B sales needed |

---

*Total items in this document: ~600+ checkboxes across all tiers and domains.*  
*You are currently at Tier 3 (From Scratch), at the junction of Part 2 → Part 3.*  
*Work the priority table above — everything else is reference material.*
