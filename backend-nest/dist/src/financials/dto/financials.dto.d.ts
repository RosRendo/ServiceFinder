export declare class PayoutRequestDto {
    amount: number;
    destinationBank: string;
    accountName: string;
    accountNumber: string;
}
export declare class ProcessPayoutDto {
    status: 'paid' | 'rejected';
    adminNotes?: string;
}
