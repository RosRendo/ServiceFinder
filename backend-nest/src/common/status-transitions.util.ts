import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

export const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['assigned', 'confirmed', 'arrived', 'in_progress', 'cancelled'],
  assigned: [
    'confirmed',
    'pending',
    'en_route',
    'arrived',
    'in_progress',
    'cancelled',
  ],
  confirmed: ['assigned', 'en_route', 'arrived', 'in_progress', 'cancelled'],
  en_route: ['arrived', 'in_progress', 'cancelled'],
  arrived: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed: [],
  cancelled: [],
};

export const ALL_VALID_TARGET_STATUSES: string[] = Array.from(
  new Set(Object.values(VALID_TRANSITIONS).flat()),
);

export function canTransitionTo(
  currentStatus: string,
  newStatus: string,
): boolean {
  if (!currentStatus || !newStatus) return false;
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.includes(newStatus);
}

export function getValidTransitions(currentStatus: string): string[] {
  return VALID_TRANSITIONS[currentStatus] || [];
}

export function validateTransition(
  currentStatus: string,
  newStatus: string,
): void {
  if (!canTransitionTo(currentStatus, newStatus)) {
    const valid = getValidTransitions(currentStatus);
    const message =
      `Invalid status transition from "${currentStatus}" to "${newStatus}". ` +
      `Valid transitions: ${valid.length > 0 ? valid.join(', ') : 'none (terminal state)'}`;
    if (!VALID_TRANSITIONS[currentStatus]) {
      throw new BadRequestException(message);
    }
    throw new ConflictException(message);
  }
}
