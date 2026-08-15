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
        success: boolean;
        qrString: any;
        qrImage: any;
        abapay_deeplink: any;
        amount: any;
        currency: any;
        message?: undefined;
        rawData?: undefined;
    } | {
        success: boolean;
        message: string;
        rawData: any;
        qrString?: undefined;
        qrImage?: undefined;
        abapay_deeplink?: undefined;
        amount?: undefined;
        currency?: undefined;
    } | {
        success: boolean;
        message: string;
        qrString?: undefined;
        qrImage?: undefined;
        abapay_deeplink?: undefined;
        amount?: undefined;
        currency?: undefined;
        rawData?: undefined;
    }>;
    generateKhqr(dto: CheckoutSessionDto, req: any): Promise<{
        message: string;
        qrString: any;
        amount: string;
        billNumber: string;
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
    createWingCheckout(dto: CheckoutSessionDto, req: any): Promise<{
        success: boolean;
        message: string;
        webPaymentUrl: string;
        orderReferenceNo: string;
    }>;
    handleWingWebhook(body: any): Promise<{
        code: string;
        message: string;
    }>;
    checkWingStatus(id: string): Promise<{
        success: boolean;
        status: string;
        message?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        status: string;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        status: string;
        error: any;
        message?: undefined;
    }>;
}
