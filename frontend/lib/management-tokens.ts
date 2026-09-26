/**
 * Canonical Anti-AI-Slop Design Tokens for Company and Admin Management Portals
 * Matches specs/001-clean-management-ui/contracts/ui-design-tokens.json
 */

export const MANAGEMENT_TOKENS = {
  surfaces: {
    pageBackground: 'bg-slate-50 dark:bg-[#0B132B]',
    cardBackground: 'bg-white dark:bg-[#111C38]',
    hoverRowBackground: 'hover:bg-slate-50 dark:hover:bg-[#1A274E]',
    activeRowBackground: 'bg-slate-100 dark:bg-[#233363]',
    drawerBackground: 'bg-white dark:bg-[#111C38]',
  },
  borders: {
    subtle: 'border-slate-200 dark:border-slate-800',
    strong: 'border-slate-300 dark:border-slate-700',
    focusRing: 'focus:ring-2 focus:ring-[#0A192F] focus:outline-none',
  },
  text: {
    primary: 'text-slate-900 dark:text-slate-100',
    secondary: 'text-slate-600 dark:text-slate-400',
    tertiary: 'text-slate-400 dark:text-slate-500',
    brandPrimary: 'text-[#0A192F] dark:text-sky-400',
  },
  statusPills: {
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-800 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      dot: 'bg-emerald-600',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      dot: 'bg-amber-600',
    },
    critical: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-800 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
      dot: 'bg-rose-600',
    },
    info: {
      bg: 'bg-sky-50 dark:bg-sky-950/40',
      text: 'text-sky-800 dark:text-sky-300',
      border: 'border-sky-200 dark:border-sky-800',
      dot: 'bg-sky-600',
    },
    neutral: {
      bg: 'bg-slate-100 dark:bg-slate-900',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-700',
      dot: 'bg-slate-500',
    },
  },
} as const;

export type SemanticStatusCategory = keyof typeof MANAGEMENT_TOKENS.statusPills;

/**
 * Maps raw backend status strings to standardized quiet semantic tiers.
 */
export function getSemanticStatusCategory(status: string): SemanticStatusCategory {
  const s = (status || '').toLowerCase().trim();
  
  // Success
  if (['active', 'approved', 'verified', 'completed', 'resolved', 'paid', 'success'].includes(s)) {
    return 'success';
  }
  
  // Warning
  if (['pending', 'under_review', 'in_review', 'dispatched', 'awaiting_payment', 'review'].includes(s)) {
    return 'warning';
  }
  
  // Critical
  if (['rejected', 'suspended', 'cancelled', 'disputed', 'overdue', 'failed', 'banned'].includes(s)) {
    return 'critical';
  }
  
  // Info
  if (['in_progress', 'assigned', 'scheduled', 'processing'].includes(s)) {
    return 'info';
  }
  
  // Neutral
  return 'neutral';
}
