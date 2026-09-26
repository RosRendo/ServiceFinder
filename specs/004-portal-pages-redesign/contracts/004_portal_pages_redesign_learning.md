# Architecture & Engineering Decisions: Portal Pages Redesign (004-portal-pages-redesign)

**Date**: 2026-09-25  
**Module**: `frontend` (Next.js 16 App Router)  
**Scope**: 45+ Admin and Company Management Portal Pages  

---

## 1. Executive Summary

Feature `004-portal-pages-redesign` standardized the visual hierarchy, interaction models, and UI resilience across all 45+ administrative (`/admin/*`) and company management (`/company/*`) pages. The redesign eliminated dead UI controls, unified row-to-drawer slideover inspections, migrated destructive confirmations to accessible modal dialogs, implemented a monochromatic "quiet luxury" token system, and resolved cross-platform file encoding traps.

---

## 2. Core Architectural Decisions & Enforced Rules

### Rule 1: Zero Dead Buttons & Unwired Controls
* **Problem**: Prototypical code contained placeholder buttons (`onClick={() => {}}`), unrouted links, or non-functional icon buttons.
* **Standard**: Every user-facing action element must either:
  1. Trigger a concrete state handler (e.g., drawer opening, filter toggling, form submission).
  2. Perform valid navigation via Next.js `<Link href="...">` (no raw HTML `<a>` tags for internal paths).
  3. Be pruned entirely from the DOM if no operational backend capability exists.
* **Verification**: Code audits and ESLint rules enforce zero unhandled interaction handlers.

### Rule 2: Row-to-Drawer Slideover Inspection Pattern
* **Pattern**: Clicking any row in a management table (`ManagementDataGrid` or custom table) opens a contextual slideover drawer on the right edge of the screen rather than redirecting to a separate page or opening a disruptive pop-up modal.
* **Foundation**: All domain drawers inherit from `BaseDrawer` (`@/components/drawers/BaseDrawer`):
  - Focus trapping and `Escape` key listeners.
  - Automatic `document.body.style.overflow = "hidden"` scroll locking.
  - Backdrop blur overlay (`bg-background/80 backdrop-blur-sm`).
  - Standardized header (title, subtitle, status badge) and sticky action footer.
* **Integrated Drawers**:
  - `DisputeDrawer`, `ServiceAreaDrawer`, `CommissionRuleDrawer`, `BookingDrawer`, `BookingDispatchDrawer`, `CustomerDrawer`, `ReviewDrawer`, `StaffDrawer`, `ServiceTypeDrawer`, `CategoryDrawer`, and `CompanyDrawer`.

### Rule 3: Unified `ConfirmationDialog` for Destructive Actions
* **Problem**: Inconsistent use of browser-native `window.confirm()` or raw `confirm()`, causing blocking thread execution, poor UX, and accessibility failures.
* **Standard**: 100% elimination of browser `confirm()`, `window.confirm()`, and `alert()` calls.
* **Implementation**: Standardized on `ConfirmationDialog` (`@/components/admin/ConfirmationDialog` / `@/components/company/ConfirmationDialog`):
  - Variants: `danger` (red/crimson accent), `warning` (amber accent), `info`.
  - Supports asynchronous `onConfirm` actions with loading spinners and button disablement.
  - Retains row context while awaiting user confirmation.
* **Enforcement**: Regular expression search `\bconfirm\(` and `\balert\(` strictly yields 0 occurrences across the codebase.

---

## 3. Monochromatic Quiet-Luxury Token Migration

All hardcoded color palettes (`slate-50` through `slate-950`, `bg-white`, `text-black`, `bg-gray-*`) were migrated to semantic design tokens defined in CSS variables:

| Legacy Utility | Semantic Token Utility | Purpose |
| :--- | :--- | :--- |
| `bg-white`, `bg-slate-900` | `bg-background` | Canvas / viewport background |
| `bg-white/80`, `bg-slate-800` | `bg-card` | Surface cards, metric widgets, drawers |
| `border-slate-200`, `border-slate-800` | `border-border` / `border-border/60` | Subtle hairline dividers and card boundaries |
| `text-slate-900`, `text-slate-100` | `text-foreground` | High-contrast primary headings and data |
| `text-slate-500`, `text-slate-400` | `text-muted-foreground` | Supporting descriptions, metadata, labels |
| `bg-slate-100`, `bg-slate-800/50` | `bg-muted` / `bg-muted/50` | Table headers, secondary pills, tag backdrops |
| `hover:bg-slate-50`, `hover:bg-slate-800` | `hover:bg-muted/60` | Interactive row and button hover states |

This migration guarantees automatic dark mode harmony, brand tint adaptability, and zero low-contrast visual collisions.

---

## 4. Engineering Gotchas & Optimization Discoveries

### 4.1. Edge Authentication Simulation for Automated Verification
Next.js 15+ proxy middleware (`proxy.ts`) gates all `/admin/*` and `/company/*` routes using `jose` JWT verification with role validation. Unauthenticated HTTP probes return `307 Temporary Redirect` to `/auth/login`.  
**Solution**: Route verification scripts programmatically generate valid HMAC-SHA256 signed JWTs using `jose.SignJWT` matching `JWT_SECRET` with appropriate role claims (`admin` vs `company`), enabling automated health-check testing without requiring live login automation.

### 4.2. Windows-1252 / ANSI Character Encoding Trap in Turbopack
* **Issue**: Turbopack crashed with `Reading source code for parsing failed ... invalid utf-8 sequence of 1 bytes from index 8418` on pages containing em dashes (`—`), degree symbols (`°`), middle dots (`·`), or bullets (`•`) that were saved in Windows-1252 (ANSI byte `0xB7` instead of UTF-8 `0xC2 0xB7`).
* **Detection & Fix**: An automated Node.js byte-scanning script searched all source files using `TextDecoder('utf-8', { fatal: true })`. Five affected files (`companies/page.tsx`, `reviews/page.tsx`, `settings/page.tsx`, `verification/page.tsx`, `dashboard/page.tsx`) were re-encoded cleanly to UTF-8.
* **Rule**: When executing string replacements in Windows PowerShell, always specify `-Encoding utf8` or perform batch edits through Node.js UTF-8 buffers.

---

## 5. Verification Results

1. **Vitest Unit & Integration Suites**:
   - `11/11` test files passed.
   - `33/33` individual tests passed.
2. **ESLint Code Quality**:
   - `0 errors` across the entire codebase.
   - 37 non-blocking image optimization warnings.
3. **Route HTTP Health Checks**:
   - `18/18` `/admin/*` routes responded `200 OK`.
   - `22/22` `/company/*` routes responded `200 OK`.
   - Zero runtime exceptions or 500 errors.
