'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  /** Short title shown above the message */
  title?: string;
  /** The error message (from the API or a generic fallback) */
  message?: string;
  /** Called when the user clicks Retry. Omit to hide the button. */
  onRetry?: () => void;
}

/**
 * Full-area error state for data-fetching pages: icon + message + retry.
 * Use it when a page's primary data fails to load, in place of a blank
 * content area. For inline errors (form submits, mutations) prefer
 * ErrorMessage or toasts.
 */
export function ErrorState({
  title = 'Failed to load',
  message = 'Something went wrong while loading this page.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-16 text-center animate-fade-in">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="font-display text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-6">
          <RotateCcw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      )}
    </div>
  );
}
