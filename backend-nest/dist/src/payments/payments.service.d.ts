import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto, UpdatePaymentDto, CheckoutSessionDto, CompletePaymentDto, ConfirmCashDto } from './dto/payment.dto';
export declare class PaymentsService {
    private prisma;
    private config;
    private readonly logger;
    constructor(prisma: PrismaService, config: ConfigService);
    private notify;
    getAllPayments(query: any, user: any): Promise<{
        payments: any[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getPaymentById(id: bigint, user: any): Promise<{
        payment: any;
    }>;
    createPayment(dto: CreatePaymentDto, user: any): Promise<{
        message: string;
        payment: any;
    }>;
    updatePayment(id: bigint, dto: UpdatePaymentDto): Promise<{
        message: string;
        payment: any;
    }>;
    createAbaCheckout(dto: CheckoutSessionDto, user: any): Promise<{
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
    generateKhqr(dto: CheckoutSessionDto, user: any): Promise<{
        message: string;
        qrString: any;
        amount: string;
        billNumber: string;
    }>;
    private wingToken;
    private wingTokenExpiry;
    getWingAccessToken(): Promise<string>;
    createWingCheckout(dto: CheckoutSessionDto, user: any): Promise<{
        success: boolean;
        message: string;
        webPaymentUrl: string;
        orderReferenceNo: string;
    }>;
    handleWingWebhook(payload: any): Promise<{
        code: string;
        message: string;
    }>;
    checkWingStatus(bookingId: bigint): Promise<{
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
    handleKhqrWebhook(body: any, headers: any): Promise<{
        status: string;
        message: string;
    }>;
    handleAbaWebhook(body: any): Promise<{
        received: boolean;
    }>;
    completePayment(dto: CompletePaymentDto, user: any): Promise<{
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
    confirmCashReceived(dto: ConfirmCashDto, user: any): Promise<{
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
    private serializePayment;
}
