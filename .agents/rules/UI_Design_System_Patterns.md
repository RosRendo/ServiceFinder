# 🎨 ServiceFinder UI Design System & Layout Patterns

This document defines the standardized UX/UI layout patterns for both the **Admin Portal** and the **Company Workspace** in ServiceFinder. Keeping these layout patterns consistent ensures that every page feels cohesive, recognizable, and professional.

---

## 🏛️ 1. Grid Directory View (List Pages)
*Used for: Users, Companies, Bookings, Staff, Transactions, Disputes, etc.*

Every table-based list page must follow this full-height grid directory pattern to remain consistent:

```
+-----------------------------------------------------------------------+
|  [Search Input]  [Filter Pill] [Filter Pill]          [Export]  [New] | -> Header Bar
+-----------------------------------------------------------------------+
|  Total: 250  |  Active: 210  |  Pending: 40                           | -> KPI Stats Bar
+-----------------------------------------------------------------------+
| [ ] Name            | Status        | Date Joined      | Actions      |
| [x] John Doe        | [ Active ]    | Aug 29, 2026     | [View]       | -> DataGrid
| [ ] Jane Smith      | [ Pending ]   | Aug 28, 2026     | [View]       |
+-----------------------------------------------------------------------+
|  [x] Selected 1 Row               [ Suspend ] [ Delete ] [ Clear ]     | -> Bulk Action Bar
+-----------------------------------------------------------------------+
```

### Layout Specifications:
1. **Parent Wrapper:** 
   - Must use `flex flex-col h-full overflow-hidden bg-background font-sans`. This prevents default document scrolling, locking the page header while the table scrolls independently.
2. **Top Header Bar:**
   - **Wrapper:** `shrink-0 flex items-center gap-3 px-6 py-3 border-b border-border bg-background`.
   - **Search Input:** A relative wrapper with left search icon (`pl-9 pr-3 h-9 bg-muted/30 border border-border rounded-lg text-sm text-foreground outline-none focus:border-violet-500/60 transition-colors`).
   - **Filter Buttons:** Simple rounded pills (`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors`). Use `bg-primary/10 text-primary border-primary/20` for active filters and `text-muted-foreground hover:bg-muted/50 border-transparent` for inactive.
   - **Actions:** Right-aligned buttons. Primary buttons (e.g. "New User") use `bg-primary text-white shadow-sm`.
3. **KPI Stats Bar:**
   - **Wrapper:** `shrink-0 flex items-center gap-6 px-6 py-2.5 border-b border-border bg-muted/10`.
   - **Items:** Simple grid stats:
     ```typescript
     <div className="flex items-center gap-2 text-xs">
       <span className="text-muted-foreground">{label}</span>
       <span className="font-bold text-foreground">{value}</span>
     </div>
     ```
4. **Data Grid Table:**
   - Nested inside `<div className="flex-1 overflow-hidden relative">` so the table handles vertical scrolling independently.
   - Checkboxes are provided for bulk operations.
   - Rows use a hover state (`hover:bg-muted/30`) and clicking any row triggers the Side Drawer.
5. **Bulk Action Bar:**
   - Smoothly slides up from the bottom when checkbox selections are active (`selectedIds.size > 0`), holding options like Delete, Suspend, or Approve.

---

## 🔎 2. Detailed Entity View (Profile / Audit Pages)
*Used for: Booking details, User profiles, Company profiles, Disputes mediation.*

All detailed entity inspection pages use a split-column layout designed for scanning and speed:

```
+-----------------------------------------------------------------------+
|  <- Back  Booking #70  [ Confirmed ]   Scheduled: Aug 29 • 5:00 PM    | -> Sticky Top Bar
+-----------------------------------------------------------------------+
|  [ LEFT COLUMN: 2/3 Width ]         | [ RIGHT COLUMN: 1/3 Width ]     |
|                                     |  lg:sticky lg:top-0 self-start  |
|  +-------------------------------+  |  +---------------------------+  |
|  | Service Information           |  |  | Admin Actions Panel       |  |
|  +-------------------------------+  |  | - Change Status           |  |
|  | Customer Profile              |  |  | - Assign Staff            |  |
|  +-------------------------------+  |  +---------------------------+  |
|  | Team & Supplier               |  |  | Financial Summary         |  |
|  +-------------------------------+  |  +---------------------------+  |
|                                     |  | Audit Timeline Tracker    |  |
|                                     |  +---------------------------+  |
+-----------------------------------------------------------------------+
```

### Layout Specifications:
1. **Sticky Top Bar Header:**
   - **Wrapper:** `bg-background border-b border-border shrink-0 z-10 sticky top-0`.
   - **Back Navigation:** Simple back arrow (`ArrowLeft`) in an outline container.
   - **Title & Status:** Big bold title with the entity ID and a status badge centered.
   - **Secondary Meta:** Row of metadata (e.g., date created, scheduled time) using thin Lucide icons.
2. **Main Layout Grid:**
   - `<div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">` inside a `flex-1 overflow-y-auto p-6` wrapper.
3. **Left Column (lg:col-span-2 space-y-6):**
   - Individual section cards: `bg-background rounded-xl border border-border p-6 shadow-sm`.
   - Section headers: `<h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-5 uppercase tracking-wider"><Icon className="w-4 h-4 text-primary" /> Title</h3>`.
4. **Right Column (space-y-6 lg:sticky lg:top-0 self-start):**
   - Must use `lg:sticky lg:top-0 self-start` to follow viewport scrolling.
   - **Action Panel:** stack of Ghost/Primary buttons for quick status overrides and dispatch actions.
   - **Financials / Timeline:** vertical cards with dot milestones (`relative pl-6 pb-5 border-l-2 border-primary/20`) mapping life-cycle events.

---

## 🗂️ 3. Drawer View (Details & Preview)
*Used for: Quick-viewing details of a table row without reloading the page.*

All Side Drawers are built on top of `BaseDrawer` and maintain this unified, premium hierarchy:

```
+------------------------------------+
|  [Icon] Title            [X Close] | -> BaseDrawer Header
|  Subtitle                          |
+------------------------------------+
|  [ Header Status Info Row ]        | -> Avatar, status badge, action link
+------------------------------------+
|  +------------------------------+  |
|  | Section Title                |  | -> Detail Grid Cards
|  | - Detail Rows                |  |
|  +------------------------------+  |
+------------------------------------+
|  +------------------------------+  |
|  | Settings Form (If editable)  |  | -> Settings form with dropdowns/inputs
|  +------------------------------+  |
+------------------------------------+
|  Quick Action Moderation Grid      | -> Colored buttons for workflow transitions
+------------------------------------+
```

### Layout Specifications:
1. **Base Drawer Call:** `<BaseDrawer open={open} onClose={onClose} title={Title} subtitle={Subtitle} width="lg">`.
2. **Status Row:** `flex items-center justify-between border-b border-border pb-4`. Contains:
   - Rounded-xl Avatar: `w-12 h-12 rounded-xl border border-border/50 shadow-sm`.
   - Status Badge: opacity text + borders matching `STATUS_CONFIG` colors.
3. **Details Card:** `bg-muted/10 border border-border rounded-xl p-4 space-y-3`.
   - Title: `text-xs font-semibold text-foreground border-b border-border/50 pb-2 mb-2 flex items-center gap-2`.
   - Rows: Flex spaces `flex justify-between items-center` with `text-muted-foreground` keys and `font-medium` values.
4. **Moderation / Quick Actions:**
   - Grid cards of color-coded quick buttons (`grid grid-cols-4 gap-2 pt-4 border-t border-border`).
   - Use standard brand HSL opacity overlays:
     - `Accept / Publish` 🟢: `bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20`
     - `Edit / View` 🔵: `bg-primary/10 text-primary hover:bg-primary/20 border-primary/20`
     - `Hide / Flag` 🟡: `bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20`
     - `Delete / Suspend` 🔴: `bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20`
