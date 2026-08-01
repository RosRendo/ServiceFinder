export const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['assigned', 'confirmed', 'arrived', 'in_progress', 'cancelled'],
  assigned: ['confirmed', 'pending', 'cancelled'],
  confirmed: ['arrived', 'in_progress', 'cancelled'],
  arrived: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed: [],
  cancelled: [],
};

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
    throw new Error(
      `Invalid status transition from "${currentStatus}" to "${newStatus}". ` +
        `Valid transitions: ${valid.length > 0 ? valid.join(', ') : 'none (terminal state)'}`,
    );
  }
}
