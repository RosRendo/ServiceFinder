import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X, Loader2 } from 'lucide-react';

export interface SlideoverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  width?: 'md' | 'lg' | 'xl' | '2xl';
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  footer?: {
    primaryAction?: {
      label: string;
      onClick: () => Promise<void> | void;
      isLoading?: boolean;
      variant?: 'default' | 'danger' | 'success';
      disabled?: boolean;
    };
    secondaryAction?: {
      label: string;
      onClick: () => void;
      disabled?: boolean;
    };
    additionalControls?: React.ReactNode;
  };
}

const WIDTH_CLASSES = {
  md: 'max-w-md',
  lg: 'max-w-xl',
  xl: 'max-w-2xl',
  '2xl': 'max-w-4xl',
};

export function SlideoverDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  width = 'lg',
  headerActions,
  children,
  footer,
}: SlideoverDrawerProps) {
  // Handle escape key and scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Subtle backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 animate-fade-in"
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
        <div
          className={cn(
            'pointer-events-auto w-screen flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl transition duration-300 transform ease-in-out',
            WIDTH_CLASSES[width]
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>
                {badge}
              </div>
              {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              {headerActions}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <span className="sr-only">Close drawer</span>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">{children}</div>

          {/* Footer Controls */}
          {footer && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div>{footer.additionalControls}</div>
              <div className="flex items-center gap-2.5">
                {footer.secondaryAction && (
                  <button
                    type="button"
                    disabled={footer.secondaryAction.disabled}
                    onClick={footer.secondaryAction.onClick}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    {footer.secondaryAction.label}
                  </button>
                )}
                {footer.primaryAction && (
                  <button
                    type="button"
                    disabled={footer.primaryAction.disabled || footer.primaryAction.isLoading}
                    onClick={footer.primaryAction.onClick}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold tracking-wide text-white transition disabled:opacity-50',
                      footer.primaryAction.variant === 'danger'
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : footer.primaryAction.variant === 'success'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-[#0A192F] hover:bg-[#1E3A8A]'
                    )}
                  >
                    {footer.primaryAction.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>{footer.primaryAction.label}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SlideoverDrawer;
