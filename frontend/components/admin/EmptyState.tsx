import React from 'react';
import { cn } from '@/lib/utils';
import { Search, AlertCircle, Inbox, FilterX, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isValidActionTarget } from '@/types/actions';

export interface EmptyStateProps {
  type?: 'empty' | 'search' | 'error' | 'filter';
  title?: string;
  description?: string;
  actionLabel?: string;
  onActionClick?: () => void;
  secondaryActionLabel?: string;
  onSecondaryActionClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  type = 'empty',
  title,
  description,
  actionLabel,
  onActionClick,
  secondaryActionLabel,
  onSecondaryActionClick,
  icon,
  className,
}: EmptyStateProps) {
  const getDefaultIcon = () => {
    switch (type) {
      case 'search':
        return <Search className="w-5 h-5 text-muted-foreground" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500" />;
      case 'filter':
        return <FilterX className="w-5 h-5 text-muted-foreground" />;
      case 'empty':
      default:
        return <Inbox className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getDefaultTitle = () => {
    switch (type) {
      case 'search':
        return 'No results found';
      case 'error':
        return 'Failed to load records';
      case 'filter':
        return 'No matching records';
      case 'empty':
      default:
        return 'No records available';
    }
  };

  const getDefaultDescription = () => {
    switch (type) {
      case 'search':
        return 'Try checking for typos or searching with different keywords.';
      case 'error':
        return 'An error occurred while communicating with the server. Please try again.';
      case 'filter':
        return 'There are no items matching the currently selected status or criteria.';
      case 'empty':
      default:
        return 'There are currently no records in this directory or workspace.';
    }
  };

  const hasValidAction = actionLabel && isValidActionTarget(onActionClick);
  const hasValidSecondary = secondaryActionLabel && isValidActionTarget(onSecondaryActionClick);

  return (
    <div className={cn('p-12 text-center flex flex-col items-center justify-center gap-3', className)}>
      <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center">
        {icon || getDefaultIcon()}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          {title || getDefaultTitle()}
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">
          {description || getDefaultDescription()}
        </p>
      </div>

      {(hasValidAction || hasValidSecondary) && (
        <div className="flex items-center gap-2 pt-2">
          {hasValidSecondary && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSecondaryActionClick}
              className="h-8 text-xs font-medium text-slate-700 border-slate-200 hover:bg-slate-50"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
              {secondaryActionLabel}
            </Button>
          )}
          {hasValidAction && (
            <Button
              size="sm"
              onClick={onActionClick}
              className="h-8 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800"
            >
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
