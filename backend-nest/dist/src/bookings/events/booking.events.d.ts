export declare class BookingAssignedEvent {
    readonly bookingId: bigint;
    readonly staffId: bigint;
    readonly companyId: bigint;
    readonly customerId: bigint;
    constructor(bookingId: bigint, staffId: bigint, companyId: bigint, customerId: bigint);
}
export declare class BookingAcceptedEvent {
    readonly bookingId: bigint;
    readonly staffId: bigint;
    readonly companyId: bigint;
    readonly customerId: bigint;
    constructor(bookingId: bigint, staffId: bigint, companyId: bigint, customerId: bigint);
}
export declare class BookingRejectedEvent {
    readonly bookingId: bigint;
    readonly staffId: bigint;
    readonly companyId: bigint;
    readonly customerId: bigint;
    constructor(bookingId: bigint, staffId: bigint, companyId: bigint, customerId: bigint);
}
export declare class BookingCompletedEvent {
    readonly bookingId: bigint;
    readonly companyId: bigint;
    readonly customerId: bigint;
    readonly totalPrice: number;
    readonly platformFee: number;
    readonly paymentMethod: string;
    constructor(bookingId: bigint, companyId: bigint, customerId: bigint, totalPrice: number, platformFee: number, paymentMethod: string);
}
export declare class DisputeOpenedEvent {
    readonly disputeId: bigint;
    readonly bookingId: bigint;
    readonly companyId: bigint;
    readonly amount: number;
    constructor(disputeId: bigint, bookingId: bigint, companyId: bigint, amount: number);
}
export declare class BookingStatusChangedEvent {
    readonly bookingId: bigint;
    readonly oldStatus: string;
    readonly newStatus: string;
    readonly changedById?: bigint | undefined;
    readonly notes?: string | undefined;
    constructor(bookingId: bigint, oldStatus: string, newStatus: string, changedById?: bigint | undefined, notes?: string | undefined);
}
