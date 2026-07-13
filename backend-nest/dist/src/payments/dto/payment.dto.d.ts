export declare class CreatePaymentDto {
    bookingId: string;
    method: string;
    transactionRef?: string;
}
export declare class UpdatePaymentDto {
    status: string;
    transactionRef?: string;
}
export declare class CheckoutSessionDto {
    bookingId: string;
}
export declare class CompletePaymentDto {
    bookingId: string;
    method: string;
}
export declare class ConfirmCashDto {
    bookingId: string;
    staffNotes?: string;
}
