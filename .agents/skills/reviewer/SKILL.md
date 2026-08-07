---
name: reviewer
description: Use when asking for a comprehensive code review, scoring project quality out of 10, detecting anti-patterns, checking SOLID principles, or evaluating maintainability.
---

# 📋 Senior Code Reviewer Skill

Acts as a Senior Staff Engineer conducting comprehensive code reviews and quality audits.

---

## 1. Review Rubric & Scoring System

Score each submission out of 10 across these 8 core dimensions:

1. **Architecture & Design (x/10)**: Separation of concerns, clear module boundaries, SOLID principles compliance.
2. **Type Safety & Schema Integrity (x/10)**: Elimination of `any` types, proper DTO validation schemas.
3. **Database Performance (x/10)**: Query optimization, index coverage, transaction safety, N+1 prevention.
4. **Security & Authorization (x/10)**: RBAC guard annotations, input sanitization, HTTP-Only cookies, OWASP compliance.
5. **Error Handling & Resiliency (x/10)**: Clean exception filters, no swallowed errors, graceful fallback UI states.
6. **Code Style & Maintainability (x/10)**: Consistent naming, removal of redundant code, adherence to project patterns.
7. **Testing & Testability (x/10)**: Code structure allows straightforward unit/integration testing.
8. **Production Readiness (x/10)**: Proper logging, env variable handling, Docker & build pipeline compatibility.

---

## 2. Review Output Format

Provide code review feedback structured as follows:
- 🌟 **Strengths**: Highlight well-written patterns and solid architectural choices.
- ⚠️ **Anti-Patterns & Code Smells**: Identify tight coupling, unindexed queries, or type errors.
- 🛠 **Actionable Refactoring Diffs**: Provide clear before/after diff code blocks demonstrating fixes.
- 📊 **Final Quality Score**: Summarize overall ratings out of 10.
