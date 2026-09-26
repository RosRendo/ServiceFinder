# Data Model: Interactive Navigation & Action Architecture

## 1. Action Button Schema & Intent Model

Every interactive button in the management portals must adhere to this structured intent model:

```typescript
export type ActionFeedbackType = 
  | 'navigate'          // Transitions to another route via Link/router.push
  | 'open_drawer'       // Opens a SlideoverDrawer with record context
  | 'open_modal'        // Opens a ConfirmationDialog or InputModal
  | 'trigger_mutation'  // Submits an API action with toast feedback & loading state
  | 'toggle_filter'     // Updates client-side or URL query state

export interface ActionButtonDefinition {
  id: string;
  label: string;
  icon?: string;
  variant: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';
  feedbackType: ActionFeedbackType;
  target: string | (() => Promise<void> | void);
  disabledReason?: string; // If disabled, tooltip or banner explains why
  requiredPermission?: string;
  auditLabel?: string;
}
```

### Invariant Validation Rules
- **Rule 1 (No Dead Actions)**: `target` cannot be `undefined`, `null`, `""`, or a no-op function `() => {}`.
- **Rule 2 (No Orphan Drawers)**: Any button specifying `open_drawer` must have a corresponding drawer state handler and non-empty drawer component bound to the page shell.
- **Rule 3 (Visual Confirmation)**: Any destructive action (delete, reject, ban, cancel) must route through `ConfirmationDialog` before executing.

---

## 2. Page Upgrade Ledger Model

To ensure transparency and tracking of what was upgraded on every single page, each page maintains an audit ledger entry:

```typescript
export interface PageUpgradeRecord {
  route: string;
  portal: 'admin' | 'company';
  title: string;
  previousState: {
    visualAesthetic: 'legacy_multicolor' | 'inconsistent_cards' | 'plain_table';
    deadButtonCount: number;
    drawerSupport: boolean;
  };
  upgradedState: {
    visualAesthetic: 'quiet_luxury_monochrome';
    deadButtonCount: 0;
    drawerSupport: boolean;
    activeDrawers: string[];
    actionButtonsWired: string[];
    emptyStateEnhanced: boolean;
  };
  keyImprovements: string[];
  verificationStatus: 'verified_active' | 'in_progress' | 'pending';
}
```

---

## 3. Slideover Drawer Data Architecture

Drawers must consistently accept structured context rather than raw unformatted JSON:

```typescript
export interface SlideoverDrawerProps<T = any> {
  isOpen: boolean;
  onClose: () => void;
  record: T | null;
  title: string;
  badge?: {
    label: string;
    variant: 'neutral' | 'success' | 'warning' | 'danger';
  };
  actions?: ActionButtonDefinition[];
  isLoading?: boolean;
}
```
