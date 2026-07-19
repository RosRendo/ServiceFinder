"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WebhooksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let WebhooksService = WebhooksService_1 = class WebhooksService {
    prisma;
    logger = new common_1.Logger(WebhooksService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleKhqrPayment(payload) {
        this.logger.log(`Received KHQR Webhook payload: ${JSON.stringify(payload)}`);
        const { bookingId, transactionRef, status, amount } = payload;
        if (!bookingId || status !== 'SUCCESS') {
            this.logger.warn('Invalid or unsuccessful payment payload ignored.');
            return { received: true, status: 'ignored' };
        }
        return this.prisma.$transaction(async (tx) => {
            const booking = await tx.booking.findUnique({
                where: { id: BigInt(bookingId) },
                include: { company: true },
            });
            if (!booking) {
                throw new common_1.NotFoundException(`Booking ${bookingId} not found`);
            }
            const payment = await tx.payment.findUnique({
                where: { bookingId: booking.id },
            });
            if (!payment) {
                this.logger.error(`No payment record found for booking ${bookingId}`);
                return { received: true, status: 'error' };
            }
            if (payment.status === 'paid') {
                this.logger.log(`Payment for booking ${bookingId} is already paid.`);
                return { received: true, status: 'already_processed' };
            }
            await tx.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'paid',
                    transactionRef: transactionRef || `KHQR-${Date.now()}`,
                    paidAt: new Date(),
                },
            });
            await tx.booking.update({
                where: { id: booking.id },
                data: { status: 'confirmed' },
            });
            const totalAmount = Number(payment.amount);
            const companyShare = totalAmount * 0.9;
            await tx.transaction.create({
                data: {
                    ownerType: 'company',
                    ownerId: booking.companyId,
                    amount: companyShare,
                    type: 'credit',
                    category: 'booking_revenue',
                    description: `Revenue from booking #${booking.id} (after 10% commission)`,
                    bookingId: booking.id,
                },
            });
            this.logger.log(`Successfully processed KHQR payment for booking ${booking.id}. Credited $${companyShare} to Company ${booking.companyId}.`);
            return { received: true, status: 'processed' };
        });
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = WebhooksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map