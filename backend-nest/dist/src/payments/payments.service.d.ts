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
