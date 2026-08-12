"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_TRANSITIONS = void 0;
exports.canTransitionTo = canTransitionTo;
exports.getValidTransitions = getValidTransitions;
exports.validateTransition = validateTransition;
exports.VALID_TRANSITIONS = {
    pending: ['assigned', 'confirmed', 'arrived', 'in_progress', 'cancelled'],
    assigned: ['confirmed', 'pending', 'cancelled'],
    confirmed: ['en_route', 'arrived', 'in_progress', 'cancelled'],
    en_route: ['arrived', 'in_progress', 'cancelled'],
    arrived: ['in_progress', 'cancelled'],
    in_progress: ['completed'],
    completed: [],
    cancelled: [],
};
function canTransitionTo(currentStatus, newStatus) {
    if (!currentStatus || !newStatus)
        return false;
    const allowed = exports.VALID_TRANSITIONS[currentStatus];
    if (!allowed)
        return false;
    return allowed.includes(newStatus);
}
function getValidTransitions(currentStatus) {
    return exports.VALID_TRANSITIONS[currentStatus] || [];
}
function validateTransition(currentStatus, newStatus) {
    if (!canTransitionTo(currentStatus, newStatus)) {
        const valid = getValidTransitions(currentStatus);
        throw new Error(`Invalid status transition from "${currentStatus}" to "${newStatus}". ` +
            `Valid transitions: ${valid.length > 0 ? valid.join(', ') : 'none (terminal state)'}`);
    }
}
//# sourceMappingURL=status-transitions.util.js.map