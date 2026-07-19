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
var WebhooksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto = __importStar(require("crypto"));
let WebhooksService = WebhooksService_1 = class WebhooksService {
    prisma;
    logger = new common_1.Logger(WebhooksService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    verifyAbaSignature(tran_id, status, hash) {
        const apiKey = process.env.ABA_API_KEY;
        if (!apiKey) {
            this.logger.error('❌ ABA_API_KEY is not configured in environment variables. Rejecting all webhooks for security.');
            throw new common_1.UnauthorizedException('Webhook secret is not configured on the server.');
        }
        if (!hash) {
            this.logger.warn('⚠️ ABA webhook received with no hash.');
            throw new common_1.UnauthorizedException('Missing webhook hash.');
        }
        const expectedHashString = (tran_id || '') + (status || '');
        const expectedHash = crypto
            .createHmac('sha512', apiKey)
            .update(expectedHashString)
            .digest('base64');
        if (hash !== expectedHash) {
            this.logger.warn(`⚠️ Invalid ABA signature. Expected: ${expectedHash}, Got: ${hash}`);
            throw new common_1.UnauthorizedException('Invalid webhook signature. Possible forgery attempt.');
        }
        this.logger.log('✅ ABA PayWay webhook signature verified successfully.');
    }
    async handleAbaPayment(payload) {
        const { tran_id, status, hash } = payload;
        this.verifyAbaSignature(tran_id, status, hash);
        this.logger.log(`Received verified ABA Webhook payload: ${JSON.stringify(payload)}`);
        if (status !== '0' && status !== 'APPROVED') {
            this.logger.warn(`Payment failed or declined. Status: ${status}`);
            return { received: true, status: 'ignored' };
        }
        return this.prisma.$transaction(async (tx) => {
            const payment = await tx.payment.findFirst({
                where: { transactionRef: tran_id },
            });
            if (!payment) {
                this.logger.error(`No payment record found for tran_id ${tran_id}`);
                return { received: true, status: 'error' };
            }
            if (payment.status === 'paid') {
                this.logger.log(`Payment for tran_id ${tran_id} is already paid.`);
                return { received: true, status: 'already_processed' };
            }
            const booking = await tx.booking.findUnique({
                where: { id: payment.bookingId },
                include: { company: true },
            });
            if (!booking) {
                throw new common_1.NotFoundException(`Booking ${payment.bookingId} not found`);
            }
            await tx.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'paid',
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
            this.logger.log(`Successfully processed ABA payment for booking ${booking.id}. Credited $${companyShare} to Company ${booking.companyId}.`);
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