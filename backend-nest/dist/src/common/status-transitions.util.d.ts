export declare const VALID_TRANSITIONS: Record<string, string[]>;
export declare function canTransitionTo(currentStatus: string, newStatus: string): boolean;
export declare function getValidTransitions(currentStatus: string): string[];
export declare function validateTransition(currentStatus: string, newStatus: string): void;
