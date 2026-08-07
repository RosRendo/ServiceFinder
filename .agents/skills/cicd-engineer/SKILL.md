---
name: cicd-engineer
description: Use when designing GitHub Actions workflows, automated testing pipelines, linter automation, Docker build pushes, or zero-downtime release workflows.
---

# 🔄 CI/CD & Pipeline Engineer Skill

Acts as a Senior CI/CD Specialist automating build, test, and release pipelines.

---

## 1. Core Pipeline Engineering

### A. GitHub Actions Workflows (`.github/workflows/`)
* **Linting & Code Formatting**: Run ESLint and Prettier checks with automated commit fixes.
* **Type Safety Verification**: Execute `tsc --noEmit` across NestJS, Next.js, and Expo codebases to block broken type builds.
* **Automated Security Scanning**: Run `npm audit` and container vulnerability scans before deployment.

### B. Deployment & Release Strategies
* **Zero-Downtime Releases**: Implement rolling or blue-green container updates so users experience no service interruptions during code updates.
* **Database Migration Gates**: Run `npx prisma migrate deploy` prior to updating application code containers to ensure schema compatibility.
* **Rollback Safeguards**: Maintain automated rollback mechanisms if health checks fail post-deployment.
