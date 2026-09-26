# Button Action & Click Feedback Contract

**Contract Status**: Active / Strict Enforcement
**Governing Principle**: Every Click Must Show Something; Zero Dead Buttons.

---

## 1. Prohibited Anti-Patterns (Zero Tolerance)

| Anti-Pattern | Description | Remediation Required |
| :--- | :--- | :--- |
| **Silent Click** | Button with `onClick={() => {}}` or no click handler. | **Remove button** or wire to a real mutation/drawer/modal. |
| **Dead Link** | `<a href="#">` or `<Link href="">` that scrolls to top. | Replace with explicit route or convert to button with drawer trigger. |
| **Ghost Drawer Button** | Action inside a slideover drawer (e.g., "Export PDF") with no endpoint. | **Omit from drawer footer completely.** |
| **Unresponsive Row** | Data table row styled as clickable (`cursor-pointer`) that does nothing when clicked. | Bind `onClick={() => setSelectedRecord(row)}` to open slideover drawer. |
| **Deceptive Icon** | Three-dots action menu (`MoreHorizontal`) whose menu items do not execute. | If menu items have no action, remove the three-dots dropdown completely. |

---

## 2. Mandatory Feedback Matrix

Every button must implement at least one of these 4 feedback channels:

```text
User Click
   │
   ├──► 1. Page Transition
   │       └── Uses Next.js <Link> or router.push() to a valid subpage route.
   │
   ├──► 2. Slideover Drawer Expansion
   │       └── Smooth slide from right edge with full record context & metadata.
   │
   ├──► 3. Modal / Confirmation Dialog
   │       └── Structured dialog (e.g., "Confirm Cancellation" or "Approve Payout").
   │
   └──► 4. Asynchronous Mutation with Toast Feedback
           └── Button shows spinner during fetch -> displays toast.success/error.
```

---

## 3. Empty State Action Standards

When a page or table contains zero items:
- Never show an empty white void.
- Always display `EmptyState` component with:
  - Clean slate-900 line icon (e.g. `Inbox`, `CalendarClock`, `FileText`).
  - Clear title (e.g. "No Pending Disputes Found").
  - Helpful descriptive sentence.
  - Exactly **one** primary action button that is 100% functional (e.g., "Create New Booking", "Reset Filters", "Refresh Queue").
