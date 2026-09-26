import React from 'react';
import { cn } from '@/lib/utils';
import { MANAGEMENT_TOKENS, getSemanticStatusCategory, SemanticStatusCategory } from '@/lib/management-tokens';

export interface StatusPillProps {
  status: string;
  label?: string;
  category?: SemanticStatusCategory;
  showDot?: boolean;
  className?: string;
}

export function StatusPill({
  status,
  label,
  category,
  showDot = true,
  className,
}: StatusPillProps) {
  const cat = category || getSemanticStatusCategory(status);
  const pillTokens = MANAGEMENT_TOKENS.statusPills[cat] || MANAGEMENT_TOKENS.statusPills.neutral;

  // Format display text: e.g. "under_review" -> "Under Review"
  const displayLabel = label || status
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors',
        pillTokens.bg,
        pillTokens.text,
        pillTokens.border,
        className
      )}
    >
      {showDot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full', pillTokens.dot)}
          aria-hidden="true"
        />
      )}
      <span>{displayLabel}</span>
    </span>
  );
}

// Backward-compatible alias
export { StatusPill as StatusBadge };
export default StatusPill;
