import { PaymentsService } from './payments.service';
import { CreatePaymentDto, UpdatePaymentDto, CheckoutSessionDto, CompletePaymentDto, ConfirmCashDto } from './dto/payment.dto';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    handleAbaWebhook(body: any): Promise<{
        received: boolean;
    }>;
    handleKhqrWebhook(body: any, headers: any): Promise<{
        status: string;
        message: string;
    }>;
    getAllPayments(query: any, req: any): Promise<{
        payments: any[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getPaymentById(id: string, req: any): Promise<{
        payment: any;
    }>;
    createPayment(dto: CreatePaymentDto, req: any): Promise<{
        message: string;
        payment: any;
    }>;
    updatePayment(id: string, dto: UpdatePaymentDto): Promise<{
        message: string;
        payment: any;
    }>;
    createAbaCheckout(dto: CheckoutSessionDto, req: any): Promise<{
        url: any;
        method: string;
        body: {
            hash: string;
            req_time: string;
            merchant_id: any;
            tran_id: string;
            amount: string;
            firstname: string;
            lastname: string;
            email: string;
            phone: string;
            type: string;
            payment_option: string;
            return_url: string;
        };
    }>;
    generateKhqr(dto: CheckoutSessionDto, req: any): Promise<{
        message: string;
        qrString: any;
        amount: string;
        billNumber: any;
    }>;
    completePayment(dto: CompletePaymentDto, req: any): Promise<{
        success: boolean;
        message: string;
        payment: {
            id: any;
            bookingId: any;
            userId: any;
            method: any;
            amount: number;
            status: any;
            paidAt: any;
        };
        booking: {
            id: any;
            status: any;
        };
    }>;
    confirmCashReceived(dto: ConfirmCashDto, req: any): Promise<{
        success: boolean;
        message: string;
        payment: {
            id: any;
            status: any;
            paidAt: any;
            transactionRef: any;
        };
        booking: {
            id: any;
            status: any;
        };
    }>;
}
