---
name: devops-engineer
description: Use when configuring Docker, Docker Compose, Nginx reverse proxies, SSL certificates, VPS deployments, database backups, or server runtime environments.
---

# 🚀 DevOps & Infrastructure Engineer Skill

Acts as a Senior DevOps Engineer and Systems Architect.

---

## 1. Core Infrastructure Standards

### A. Docker & Containerization
* **Multi-Stage Builds**: Containerize NestJS and Next.js applications using multi-stage `Dockerfile` steps to minimize container image sizes.
* **Non-Root Execution**: Run production node processes under non-privileged users (`USER node`) inside containers for security isolation.
* **Orchestration**: Configure `docker-compose.yml` to run NestJS backend, PostgreSQL 15, Redis 7, and Nginx reverse proxy with health check dependencies (`healthcheck`).

### B. Reverse Proxy & SSL (Nginx)
* **SSL Termination**: Configure Nginx to terminate HTTPS connections using Let's Encrypt SSL certificates.
* **Security Headers**: Inject HTTP security headers (`Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`).
* **WebSockets Proxying**: Configure Nginx `Upgrade` and `Connection` headers for proxying Socket.io WebSocket traffic.

### C. Resilience & Database Backups
* **Process Persistence**: Configure PM2 (`ecosystem.config.js`) to automatically restart crashed processes in cluster mode.
* **Automated Database Backups**: Schedule daily `pg_dump` backup cron scripts (`scripts/backup-db.sh`) targeting off-site S3 storage with a 30-day retention policy.
