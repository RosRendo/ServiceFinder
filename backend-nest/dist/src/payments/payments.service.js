"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const aba_hash_util_1 = require("./utils/aba-hash.util");
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../prisma/prisma.service");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    prisma;
    config;
    logger = new common_1.Logger(PaymentsService_1.name);
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    notify(tx, userId, title, body) {
        return tx.notification.create({
            data: { userId, title, body, type: 'info', isRead: false },
        });
    }
    async getAllPayments(query, user) {
        const { userId, status, page = 1, limit = 10 } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (user.role === 'customer') {
            where.userId = BigInt(user.id);
        }
        else if (user.role === 'company_admin') {
            const company = await this.prisma.company.findFirst({
                where: { ownerId: BigInt(user.id) },
            });
            if (company) {
                where.booking = { companyId: company.id };
            }
            else {
                where.id = BigInt(-1);
            }
        }
        else if (userId) {
            where.userId = BigInt(userId);
        }
        if (status)
            where.status = status;
        const [payments, total] = await Promise.all([
            this.prisma.payment.findMany({
                where,
                skip: Number(skip),
                take: Number(limit),
                include: {
                    booking: {
                        include: {
                            service: { select: { name: true } },
                            company: { select: { name: true } },
                        },
                    },
                    user: { select: { id: true, fullName: true, email: true } },
                },
                orderBy: { paidAt: 'desc' },
            }),
            this.prisma.payment.count({ where }),
        ]);
        return {
            payments: payments.map((p) => this.serializePayment(p)),
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit)),
            },
        };
    }
    async getPaymentById(id, user) {
        const payment = await this.prisma.payment.findUnique({
            where: { id },
            include: {
                booking: {
                    include: {
                        service: true,
                        company: true,
                        customer: { select: { id: true, fullName: true, email: true } },
                    },
                },
                user: { select: { id: true, fullName: true, email: true } },
            },
        });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        if (user.role === 'customer' && payment.userId !== BigInt(user.id)) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return { payment: this.serializePayment(payment) };
    }
    async createPayment(dto, user) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: BigInt(dto.bookingId) },
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (booking.customerId !== BigInt(user.id))
            throw new common_1.ForbiddenException('Access denied');
        const existing = await this.prisma.payment.findUnique({
            where: { bookingId: BigInt(dto.bookingId) },
        });
        if (existing)
            throw new common_1.ConflictException('Payment already exists for this booking');
        const payment = await this.prisma.payment.create({
            data: {
                bookingId: BigInt(dto.bookingId),
                userId: BigInt(user.id),
                method: dto.method,
                amount: Number(booking.totalPrice),
                status: 'pending',
                transactionRef: dto.transactionRef,
            },
            include: { booking: { include: { service: true, company: true } } },
        });
        return {
            message: 'Payment initiated successfully',
            payment: this.serializePayment(payment),
        };
    }
    async updatePayment(id, dto) {
        const payment = await this.prisma.payment.findUnique({ where: { id } });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        const updateData = { status: dto.status };
        if (dto.transactionRef)
            updateData.transactionRef = dto.transactionRef;
        if (dto.status === 'paid')
            updateData.paidAt = new Date();
        const updated = await this.prisma.payment.update({
            where: { id },
            data: updateData,
            include: { booking: { include: { service: true, company: true } } },
        });
        return {
            message: 'Payment updated successfully',
            payment: this.serializePayment(updated),
        };
    }
    async createAbaCheckout(dto, user) {
        const bookingId = BigInt(dto.bookingId);
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { customer: true },
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (booking.customerId !== BigInt(user.id))
            throw new common_1.ForbiddenException('Access denied');
        if (booking.status !== 'pending')
            throw new common_1.BadRequestException('This booking has already been processed');
        const merchantId = this.config.get('ABA_MERCHANT_ID') || 'ecash';
        const apiKey = this.config.get('ABA_API_KEY') || 'aba_api_key_placeholder';
        const apiUrl = this.config.get('ABA_API_URL') ||
            'https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase';
        const now = new Date();
        const reqTime = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
        const tranId = `AB${bookingId}T${Math.floor(Date.now() / 1000)}`;
        const amount = Number(booking.totalPrice).toFixed(2);
        const params = {
            req_time: reqTime,
            merchant_id: merchantId,
            tran_id: tranId,
            amount: amount,
            firstname: booking.customer.fullName.split(' ')[0] || 'Customer',
            lastname: booking.customer.fullName.split(' ')[1] || 'Name',
            email: booking.customer.email || 'customer@servicefinder.local',
            phone: booking.customer.phone || '',
            type: 'purchase',
            payment_option: '',
            return_url: Buffer.from(`${this.config.get('FRONTEND_URL') || 'http://localhost:3000'}/payment/aba-success?booking_id=${bookingId}`).toString('base64'),
        };
        const hash = (0, aba_hash_util_1.generateAbaHash)(params, apiKey);
        const existingPayment = await this.prisma.payment.findUnique({
            where: { bookingId },
        });
        if (existingPayment) {
            await this.prisma.payment.update({
                where: { id: existingPayment.id },
                data: {
                    transactionRef: tranId,
                    status: 'pending',
                    method: 'bank',
                },
            });
        }
        else {
            await this.prisma.payment.create({
                data: {
                    bookingId,
                    userId: BigInt(user.id),
                    method: 'bank',
                    amount: Number(booking.totalPrice),
                    status: 'pending',
                    transactionRef: tranId,
                },
            });
        }
        return {
            url: apiUrl,
            method: 'POST',
            body: {
                ...params,
                hash,
            },
        };
    }
    async handleKhqrWebhook(body, headers) {
        this.logger.log(`Received KHQR Webhook: ${JSON.stringify(body)}`);
        return { status: 'success', message: 'Webhook received' };
    }
    async handleAbaWebhook(body) {
        const { tran_id, status, hash, apv } = body;
        const apiKey = this.config.get('ABA_API_KEY') || 'aba_api_key_placeholder';
        const expectedHashString = (tran_id || '') + (status || '');
        const expectedHash = crypto
            .createHmac('sha512', apiKey)
            .update(expectedHashString)
            .digest('base64');
        if (hash !== expectedHash) {
            throw new common_1.BadRequestException('Invalid ABA PayWay signature');
        }
        if (status === '0' || status === 'APPROVED') {
            const payment = await this.prisma.payment.findFirst({
                where: { transactionRef: tran_id },
            });
            if (payment) {
                await this.prisma.payment.update({
                    where: { id: payment.id },
                    data: { status: 'paid', paidAt: new Date() },
                });
                await this.prisma.booking.update({
                    where: { id: payment.bookingId },
                    data: { status: 'confirmed' },
                });
                await this.prisma.notification.create({
                    data: {
                        userId: payment.userId,
                        title: 'Payment Successful',
                        body: `Your ABA payment for booking #${payment.bookingId} has been confirmed.`,
                        type: 'info',
                        isRead: false,
                    },
                });
            }
        }
        else {
            const payment = await this.prisma.payment.findFirst({
                where: { transactionRef: tran_id },
            });
            if (payment) {
                await this.prisma.payment.update({
                    where: { id: payment.id },
                    data: { status: 'failed' },
                });
                await this.prisma.booking.update({
                    where: { id: payment.bookingId },
                    data: { status: 'cancelled' },
                });
            }
        }
        return { received: true };
    }
    async completePayment(dto, user) {
        if (dto.method === 'card')
            throw new common_1.BadRequestException('Card payments are currently disabled.');
        const booking = await this.prisma.booking.findUnique({
            where: { id: BigInt(dto.bookingId) },
            include: { service: true, company: true },
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (booking.customerId !== BigInt(user.id))
            throw new common_1.ForbiddenException('Access denied');
        if (booking.status !== 'pending')
            throw new common_1.BadRequestException('This booking has already been processed');
        const paymentIsCash = dto.method === 'cash';
        const result = await this.prisma.$transaction(async (tx) => {
            const existing = await tx.payment.findUnique({
                where: { bookingId: BigInt(dto.bookingId) },
            });
            let payment;
            if (existing) {
                payment = await tx.payment.update({
                    where: { id: existing.id },
                    data: {
                        method: dto.method,
                        status: paymentIsCash ? 'pending' : 'paid',
                        paidAt: paymentIsCash ? null : new Date(),
                    },
                });
            }
            else {
                payment = await tx.payment.create({
                    data: {
                        bookingId: BigInt(dto.bookingId),
                        userId: BigInt(user.id),
                        method: dto.method,
                        amount: Number(booking.totalPrice),
                        status: paymentIsCash ? 'pending' : 'paid',
                        paidAt: paymentIsCash ? null : new Date(),
                    },
                });
            }
            const updatedBooking = await tx.booking.update({
                where: { id: BigInt(dto.bookingId) },
                data: { status: 'confirmed' },
            });
            await tx.bookingStatusLog.create({
                data: {
                    bookingId: BigInt(dto.bookingId),
                    oldStatus: 'pending',
                    newStatus: 'confirmed',
                    changedBy: BigInt(user.id),
                },
            });
            const title = paymentIsCash ? 'Booking Confirmed' : 'Payment Successful';
            const body = paymentIsCash
                ? `Your booking has been confirmed. Please pay $${booking.totalPrice} in cash at service time.`
                : `Your payment of $${booking.totalPrice} has been processed successfully.`;
            await this.notify(tx, BigInt(user.id), title, body);
            return { payment, booking: updatedBooking };
        });
        return {
            success: true,
            message: paymentIsCash
                ? 'Booking confirmed. Pay cash at service time.'
                : 'Payment completed successfully!',
            payment: {
                id: result.payment.id.toString(),
                bookingId: result.payment.bookingId.toString(),
                userId: result.payment.userId.toString(),
                method: result.payment.method,
                amount: Number(result.payment.amount),
                status: result.payment.status,
                paidAt: result.payment.paidAt,
            },
            booking: {
                id: result.booking.id.toString(),
                status: result.booking.status,
            },
        };
    }
    async confirmCashReceived(dto, user) {
        const allowedRoles = ['company_admin', 'staff', 'admin'];
        if (!allowedRoles.includes(user.role)) {
            throw new common_1.ForbiddenException('Only company staff or administrators can confirm cash payments');
        }
        const booking = await this.prisma.booking.findUnique({
            where: { id: BigInt(dto.bookingId) },
            include: { payment: true, company: true, customer: true },
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (user.role === 'company_admin') {
            const company = await this.prisma.company.findFirst({
                where: { ownerId: BigInt(user.id) },
            });
            if (!company || company.id.toString() !== booking.companyId.toString()) {
                throw new common_1.ForbiddenException('Access denied – not your company');
            }
        }
        if (!booking.payment || booking.payment.method !== 'cash') {
            throw new common_1.BadRequestException('No pending cash payment found for this booking');
        }
        if (booking.payment.status === 'paid') {
            throw new common_1.BadRequestException('Cash payment already confirmed');
        }
        const paymentRecord = booking.payment;
        const result = await this.prisma.$transaction(async (tx) => {
            const payment = await tx.payment.update({
                where: { id: paymentRecord.id },
                data: {
                    status: 'paid',
                    paidAt: new Date(),
                    transactionRef: `CASH-${dto.bookingId}-${Date.now()}`,
                },
            });
            const updatedBooking = await tx.booking.update({
                where: { id: BigInt(dto.bookingId) },
                data: {
                    status: 'completed',
                    actualEndTime: new Date(),
                    ...(dto.staffNotes && { staffNotes: dto.staffNotes }),
                },
            });
            await tx.bookingStatusLog.create({
                data: {
                    bookingId: BigInt(dto.bookingId),
                    oldStatus: booking.status,
                    newStatus: 'completed',
                    changedBy: BigInt(user.id),
                },
            });
            await this.notify(tx, booking.customerId, 'Cash Payment Confirmed', `Your cash payment of $${paymentRecord.amount} for booking #${dto.bookingId} has been confirmed by ${booking.company.name}.`);
            await this.notify(tx, BigInt(user.id), 'Cash Collected', `Cash of $${paymentRecord.amount} collected for booking #${dto.bookingId} from ${booking.customer.fullName}.`);
            return { payment, booking: updatedBooking };
        });
        return {
            success: true,
            message: 'Cash payment confirmed. Booking marked as completed.',
            payment: {
                id: result.payment.id.toString(),
                status: result.payment.status,
                paidAt: result.payment.paidAt,
                transactionRef: result.payment.transactionRef,
            },
            booking: {
                id: result.booking.id.toString(),
                status: result.booking.status,
            },
        };
    }
    serializePayment(p) {
        if (!p)
            return null;
        return {
            ...p,
            id: p.id?.toString(),
            bookingId: p.bookingId?.toString(),
            userId: p.userId?.toString(),
            amount: p.amount != null ? Number(p.amount) : null,
            booking: p.booking
                ? {
                    ...p.booking,
                    id: p.booking.id?.toString(),
                    customerId: p.booking.customerId?.toString(),
                    companyId: p.booking.companyId?.toString(),
                    serviceId: p.booking.serviceId?.toString(),
                    assignedStaffId: p.booking.assignedStaffId?.toString(),
                    totalPrice: p.booking.totalPrice != null
                        ? Number(p.booking.totalPrice)
                        : null,
                    company: p.booking.company
                        ? { ...p.booking.company, id: p.booking.company.id?.toString() }
                        : null,
                    customer: p.booking.customer
                        ? { ...p.booking.customer, id: p.booking.customer.id?.toString() }
                        : null,
                    service: p.booking.service
                        ? {
                            ...p.booking.service,
                            id: p.booking.service.id?.toString(),
                            companyId: p.booking.service.companyId?.toString(),
                            serviceTypeId: p.booking.service.serviceTypeId?.toString(),
                            basePrice: p.booking.service.basePrice != null
                                ? Number(p.booking.service.basePrice)
                                : null,
                        }
                        : null,
                }
                : null,
            user: p.user ? { ...p.user, id: p.user.id?.toString() } : null,
        };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map