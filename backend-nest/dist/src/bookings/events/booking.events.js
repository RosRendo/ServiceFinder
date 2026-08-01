"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingStatusChangedEvent = exports.DisputeOpenedEvent = exports.BookingCompletedEvent = exports.BookingRejectedEvent = exports.BookingAcceptedEvent = exports.BookingAssignedEvent = void 0;
class BookingAssignedEvent {
    bookingId;
    staffId;
    companyId;
    customerId;
    constructor(bookingId, staffId, companyId, customerId) {
        this.bookingId = bookingId;
        this.staffId = staffId;
        this.companyId = companyId;
        this.customerId = customerId;
    }
}
exports.BookingAssignedEvent = BookingAssignedEvent;
class BookingAcceptedEvent {
    bookingId;
    staffId;
    companyId;
    customerId;
    constructor(bookingId, staffId, companyId, customerId) {
        this.bookingId = bookingId;
        this.staffId = staffId;
        this.companyId = companyId;
        this.customerId = customerId;
    }
}
exports.BookingAcceptedEvent = BookingAcceptedEvent;
class BookingRejectedEvent {
    bookingId;
    staffId;
    companyId;
    customerId;
    constructor(bookingId, staffId, companyId, customerId) {
        this.bookingId = bookingId;
        this.staffId = staffId;
        this.companyId = companyId;
        this.customerId = customerId;
    }
}
exports.BookingRejectedEvent = BookingRejectedEvent;
class BookingCompletedEvent {
    bookingId;
    companyId;
    customerId;
    totalPrice;
    platformFee;
    paymentMethod;
    constructor(bookingId, companyId, customerId, totalPrice, platformFee, paymentMethod) {
        this.bookingId = bookingId;
        this.companyId = companyId;
        this.customerId = customerId;
        this.totalPrice = totalPrice;
        this.platformFee = platformFee;
        this.paymentMethod = paymentMethod;
    }
}
exports.BookingCompletedEvent = BookingCompletedEvent;
class DisputeOpenedEvent {
    disputeId;
    bookingId;
    companyId;
    amount;
    constructor(disputeId, bookingId, companyId, amount) {
        this.disputeId = disputeId;
        this.bookingId = bookingId;
        this.companyId = companyId;
        this.amount = amount;
    }
}
exports.DisputeOpenedEvent = DisputeOpenedEvent;
class BookingStatusChangedEvent {
    bookingId;
    oldStatus;
    newStatus;
    changedById;
    notes;
    constructor(bookingId, oldStatus, newStatus, changedById, notes) {
        this.bookingId = bookingId;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.changedById = changedById;
        this.notes = notes;
    }
}
exports.BookingStatusChangedEvent = BookingStatusChangedEvent;
//# sourceMappingURL=booking.events.js.map