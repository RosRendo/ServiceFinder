/**
 * SLA Helper for Company Mobile Command Cockpit
 * Feature: specs/009-company-cockpit-redesign
 */

export interface SlaCalculationResult {
  minutesRemaining: number;
  formatted: string;
  status: 'critical' | 'warning' | 'healthy' | 'breached';
  isCritical: boolean;
  textColor: string;
  bgColor: string;
  borderColor: string;
  isInstant: boolean;
}

export function calculateSlaRemaining(
  bookingDate?: string,
  createdAt?: string,
  explicitDeadlineMinutes?: number
): SlaCalculationResult {
  const now = Date.now();
  let deadlineMs = 0;

  // Check if booking has explicit deadline
  if (typeof explicitDeadlineMinutes === 'number' && explicitDeadlineMinutes > 0) {
    const startMs = createdAt ? new Date(createdAt).getTime() : now;
    deadlineMs = startMs + explicitDeadlineMinutes * 60 * 1000;
  } else if (createdAt) {
    // Default response SLA window: 30 minutes from booking creation
    const createdMs = new Date(createdAt).getTime();
    deadlineMs = createdMs + 30 * 60 * 1000;
  } else if (bookingDate) {
    deadlineMs = new Date(bookingDate).getTime();
  } else {
    // Fallback: 15 minutes from now
    deadlineMs = now + 15 * 60 * 1000;
  }

  const diffMs = deadlineMs - now;
  const minutesRemaining = Math.round(diffMs / 60000);

  if (minutesRemaining <= 0) {
    return {
      minutesRemaining: 0,
      formatted: 'SLA Overdue',
      status: 'breached',
      isCritical: true,
      textColor: '#DC2626',
      bgColor: '#FEF2F2',
      borderColor: '#FCA5A5',
      isInstant: true,
    };
  }

  if (minutesRemaining < 5) {
    return {
      minutesRemaining,
      formatted: `${minutesRemaining}m left`,
      status: 'critical',
      isCritical: true,
      textColor: '#DC2626',
      bgColor: '#FEF2F2',
      borderColor: '#FECACA',
      isInstant: true,
    };
  }

  if (minutesRemaining <= 15) {
    return {
      minutesRemaining,
      formatted: `${minutesRemaining}m left`,
      status: 'warning',
      isCritical: false,
      textColor: '#D97706',
      bgColor: '#FEF3C7',
      borderColor: '#FDE68A',
      isInstant: false,
    };
  }

  return {
    minutesRemaining,
    formatted: minutesRemaining >= 60 ? `${Math.floor(minutesRemaining / 60)}h ${minutesRemaining % 60}m` : `${minutesRemaining}m left`,
    status: 'healthy',
    isCritical: false,
    textColor: '#059669',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    isInstant: false,
  };
}
