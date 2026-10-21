"use client";

import React from 'react';
import { BaseDrawer } from '@/components/drawers/BaseDrawer';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
  const footerNode = footer ? (
    <div className="flex items-center justify-between w-full">
      <div>{footer.additionalControls}</div>
      <div className="flex items-center gap-2">
        {footer.secondaryAction && (
          <Button
            type="button"
            variant="outline"
            disabled={footer.secondaryAction.disabled}
            onClick={footer.secondaryAction.onClick}
            className="h-8.5 px-3.5 text-xs font-semibold"
          >
            {footer.secondaryAction.label}
          </Button>
        )}
        {footer.primaryAction && (
          <Button
            type="button"
            disabled={footer.primaryAction.disabled || footer.primaryAction.isLoading}
            onClick={footer.primaryAction.onClick}
            className={cn(
              "h-8.5 px-4 text-xs font-bold shadow-2xs gap-1.5",
              footer.primaryAction.variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : footer.primaryAction.variant === 'success'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            )}
          >
            {footer.primaryAction.isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{footer.primaryAction.label}</span>
          </Button>
        )}
      </div>
    </div>
  ) : undefined;

  return (
    <BaseDrawer
      open={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      badge={badge}
      width={width}
      headerActions={headerActions}
      footer={footerNode}
    >
      <div className="p-6 space-y-6">
        {children}
      </div>
    </BaseDrawer>
  );
}

export default SlideoverDrawer;
