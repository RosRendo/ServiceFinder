import { cn } from '@/lib/utils';

export type StatusType = 'pending' | 'confirmed' | 'completed' | 'canceled' | 'paid' | 'failed';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'status-pending' },
  confirmed: { label: 'Confirmed', className: 'status-confirmed' },
  completed: { label: 'Completed', className: 'status-completed' },
  canceled: { label: 'Canceled', className: 'status-canceled' },
  paid: { label: 'Paid', className: 'status-paid' },
  failed: { label: 'Failed', className: 'status-failed' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const safeStatus: StatusType =
    status in statusConfig ? (status as StatusType) : 'pending';
  const config = statusConfig[safeStatus];

  return (
    <span className={cn('status-badge', config.className, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}
