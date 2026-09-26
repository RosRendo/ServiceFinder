import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

export interface ReasonOption {
  code: string;
  label: string;
}

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  actionType?: 'danger' | 'warning' | 'neutral';
  confirmLabel?: string;
  cancelLabel?: string;
  reasonOptions?: ReasonOption[];
  requireReason?: boolean;
  onConfirm: (reasonCode?: string, notes?: string) => Promise<void> | void;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  title,
  description,
  actionType = 'danger',
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  reasonOptions,
  requireReason = false,
  onConfirm,
}: ConfirmationDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const isConfirmDisabled = requireReason && !selectedReason;

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await onConfirm(selectedReason, notes);
      onClose();
    } catch {
      // Keep open on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] transition-opacity animate-fade-in"
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-left shadow-2xl transition-all">
          <div className="flex items-start gap-3.5">
            <div
              className={cn(
                'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center',
                actionType === 'danger'
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40'
                  : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40'
              )}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded p-1 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Reason selection if required */}
          {reasonOptions && reasonOptions.length > 0 && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Reason Code {requireReason && <span className="text-rose-500">*</span>}
                </label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 px-2.5 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#0A192F] focus:outline-none"
                >
                  <option value="">Select an authoritative reason...</option>
                  {reasonOptions.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Operator Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional context or internal notes..."
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#0A192F] focus:outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              disabled={isConfirmDisabled || isLoading}
              onClick={handleConfirm}
              className={cn(
                'inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide text-white transition disabled:opacity-50 disabled:cursor-not-allowed',
                actionType === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : actionType === 'warning'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-[#0A192F] hover:bg-[#1E3A8A]'
              )}
            >
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{confirmLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationDialog;
