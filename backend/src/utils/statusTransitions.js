/**
 * Status Transition Validator
 * Ensures booking status transitions follow business rules
 */

const VALID_TRANSITIONS = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['in_progress', 'cancelled'],
    in_progress: ['completed'],
    completed: [], // Terminal state - cannot transition
    cancelled: []  // Terminal state - cannot transition
};

/**
 * Check if a status transition is valid
 * @param {string} currentStatus - Current booking status
 * @param {string} newStatus - Desired new status
 * @returns {boolean} - True if transition is valid
 */
function canTransitionTo(currentStatus, newStatus) {
    if (!currentStatus || !newStatus) {
        return false;
    }

    const allowedTransitions = VALID_TRANSITIONS[currentStatus];
    if (!allowedTransitions) {
        return false;
    }

    return allowedTransitions.includes(newStatus);
}

/**
 * Get all valid transitions from a given status
 * @param {string} currentStatus - Current booking status
 * @returns {Array<string>} - Array of valid next statuses
 */
function getValidTransitions(currentStatus) {
    return VALID_TRANSITIONS[currentStatus] || [];
}

/**
 * Validate status transition and throw error if invalid
 * @param {string} currentStatus - Current booking status
 * @param {string} newStatus - Desired new status
 * @throws {Error} - If transition is invalid
 */
function validateTransition(currentStatus, newStatus) {
    if (!canTransitionTo(currentStatus, newStatus)) {
        const validTransitions = getValidTransitions(currentStatus);
        throw new Error(
            `Invalid status transition from "${currentStatus}" to "${newStatus}". ` +
            `Valid transitions: ${validTransitions.length > 0 ? validTransitions.join(', ') : 'none (terminal state)'}`
        );
    }
    return true;
}

/**
 * Check if a status is a terminal state (no further transitions possible)
 * @param {string} status - Status to check
 * @returns {boolean} - True if status is terminal
 */
function isTerminalStatus(status) {
    const transitions = VALID_TRANSITIONS[status];
    return transitions && transitions.length === 0;
}

module.exports = {
    VALID_TRANSITIONS,
    canTransitionTo,
    getValidTransitions,
    validateTransition,
    isTerminalStatus
};
