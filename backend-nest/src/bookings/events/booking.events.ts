export class BookingAssignedEvent {
  constructor(
    public readonly bookingId: bigint,
    public readonly staffId: bigint,
    public readonly companyId: bigint,
    public readonly customerId: bigint,
  ) {}
}

export class BookingAcceptedEvent {
  constructor(
    public readonly bookingId: bigint,
    public readonly staffId: bigint,
    public readonly companyId: bigint,
    public readonly customerId: bigint,
  ) {}
}

export class BookingRejectedEvent {
  constructor(
    public readonly bookingId: bigint,
    public readonly staffId: bigint,
    public readonly companyId: bigint,
    public readonly customerId: bigint,
  ) {}
}

export class BookingCompletedEvent {
  constructor(
    public readonly bookingId: bigint,
    public readonly companyId: bigint,
    public readonly customerId: bigint,
    public readonly totalPrice: number,
    public readonly platformFee: number,
    public readonly paymentMethod: string,
  ) {}
}

export class DisputeOpenedEvent {
  constructor(
    public readonly disputeId: bigint,
    public readonly bookingId: bigint,
    public readonly companyId: bigint,
    public readonly amount: number,
  ) {}
}

export class BookingStatusChangedEvent {
  constructor(
    public readonly bookingId: bigint,
    public readonly oldStatus: string,
    public readonly newStatus: string,
    public readonly changedById?: bigint,
    public readonly notes?: string,
  ) {}
}