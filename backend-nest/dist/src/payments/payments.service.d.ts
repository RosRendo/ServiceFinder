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
    generateAbaQR(bookingId: string): Promise<{
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
