/**
 * Action Button Schema & Intent Model
 * Governed by specs/004-portal-pages-redesign/contracts/button-action-contract.md
 */

export type ActionFeedbackType = 
  | 'navigate'          // Transitions to another route via Link/router.push
  | 'open_drawer'       // Opens a SlideoverDrawer with record context
  | 'open_modal'        // Opens a ConfirmationDialog or InputModal
  | 'trigger_mutation'  // Submits an API action with toast feedback & loading state
  | 'toggle_filter';    // Updates client-side or URL query state

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

export interface SlideoverDrawerProps<T = any> {
  isOpen: boolean;
  onClose: () => void;
  record: T | null;
  title?: string;
  badge?: {
    label: string;
    variant: 'neutral' | 'success' | 'warning' | 'danger';
  };
  actions?: ActionButtonDefinition[];
  isLoading?: boolean;
}

/**
 * Validates that an action button obeys Rule 1 (No Dead Actions):
 * "target cannot be undefined, null, '', or a no-op function () => {}"
 */
export function isValidActionTarget(target: string | (() => Promise<void> | void) | undefined | null): boolean {
  if (target === undefined || target === null || target === '') {
    return false;
  }
  if (typeof target === 'function') {
    const fnStr = target.toString().replace(/\s+/g, '');
    if (fnStr === '()=>{}' || fnStr === 'function(){}') {
      return false;
    }
  }
  return true;
}
