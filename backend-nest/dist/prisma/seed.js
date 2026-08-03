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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting full database seed...');
    console.log('🧹 Clearing existing data...');
    const tableNames = await prisma.$queryRaw `SELECT tablename FROM pg_tables WHERE schemaname='public'`;
    for (const { tablename } of tableNames) {
        if (tablename !== '_prisma_migrations') {
            try {
                await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
            }
            catch (error) {
            }
        }
    }
    const pw = await bcrypt.hash('password123', 10);
    console.log('📦 Creating Categories & Service Types...');
    const cat = await prisma.category.create({
        data: { name: 'Cleaning', slug: 'cleaning', displayOrder: 1, status: 'active' }
    });
    const stype = await prisma.serviceType.create({
        data: { categoryId: cat.id, name: 'Deep Cleaning', slug: 'deep-cleaning', status: 'active' }
    });
    console.log('👥 Creating Users...');
    const admin = await prisma.user.create({
        data: { fullName: 'Super Admin', email: 'admin@servicefinder.com', passwordHash: pw, role: 'admin', phone: '+1000000000', status: 'active' }
    });
    const owner = await prisma.user.create({
        data: { fullName: 'Sarah Jennings', email: 'owner1@cleaningsolutions.com', passwordHash: pw, role: 'company_admin', phone: '+1111111111', status: 'active' }
    });
    const staff = await prisma.user.create({
        data: { fullName: 'Jenny Clean', email: 'staff1@demo.com', passwordHash: pw, role: 'staff', phone: '+3333333331', status: 'active' }
    });
    const customer = await prisma.user.create({
        data: { fullName: 'Alice Wonderland', email: 'customer1@demo.com', passwordHash: pw, role: 'customer', phone: '+4444444441', status: 'active' }
    });
    console.log('🏢 Creating Companies & Services...');
    const comp = await prisma.company.create({
        data: {
            ownerId: owner.id,
            name: 'Pristine Cleaning Solutions',
            description: 'The best deep cleaning services.',
            phone: '+1111111111',
            email: 'hello@cleaningsolutions.com',
            verificationStatus: 'verified',
            bookingMode: 'open_pool',
            walletBalance: 2450.00,
            city: 'New York',
            address: '123 Clean St, NY',
        }
    });
    await prisma.companyStaff.create({
        data: { companyId: comp.id, userId: staff.id, role: 'worker', status: 'active' }
    });
    const srv = await prisma.service.create({
        data: {
            companyId: comp.id,
            serviceTypeId: stype.id,
            name: 'Full House Deep Clean',
            basePrice: 150.00,
            durationMin: 180,
            isActive: true,
        }
    });
    console.log('📅 Creating Bookings & Finance Records...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await prisma.booking.create({
        data: {
            customerId: customer.id,
            companyId: comp.id,
            serviceId: srv.id,
            status: 'pending',
            bookingDate: tomorrow,
            startTime: new Date('1970-01-01T10:00:00Z'),
            endTime: new Date('1970-01-01T13:00:00Z'),
            totalPrice: 150.00,
            platformFee: 15.00,
            companyEarnings: 135.00,
            serviceAddress: '789 Apple St, New York',
        }
    });
    const b3 = await prisma.booking.create({
        data: {
            customerId: customer.id,
            companyId: comp.id,
            serviceId: srv.id,
            status: 'completed',
            bookingDate: yesterday,
            startTime: new Date('1970-01-01T09:00:00Z'),
            endTime: new Date('1970-01-01T12:00:00Z'),
            totalPrice: 150.00,
            platformFee: 15.00,
            companyEarnings: 135.00,
            serviceAddress: '789 Apple St, New York',
        }
    });
    await prisma.payment.create({
        data: {
            bookingId: b3.id,
            userId: customer.id,
            amount: 150.00,
            currency: 'USD',
            status: 'paid',
            method: 'card',
            transactionRef: 'pi_demo_123',
        }
    });
    await prisma.invoice.create({
        data: {
            bookingId: b3.id,
            invoiceNumber: 'INV-001',
            totalAmount: 150.00,
        }
    });
    await prisma.review.create({
        data: {
            bookingId: b3.id,
            customerId: customer.id,
            companyRating: 5,
            companyComment: 'Amazing service!',
        }
    });
    console.log('🛡️ Creating Moderation & Support Data...');
    await prisma.dispute.create({
        data: {
            bookingId: b3.id,
            customerId: customer.id,
            companyId: comp.id,
            description: 'Staff broke a vase.',
            status: 'open',
            type: 'damage',
        }
    });
    await prisma.moderationLog.create({
        data: {
            adminId: admin.id,
            entityType: 'review',
            entityId: BigInt(9999),
            action: 'delete',
            reason: 'Profanity',
        }
    });
    await prisma.complianceReport.create({
        data: {
            companyId: comp.id,
            type: 'KYC',
            status: 'pending',
            notes: 'Needs manual review',
        }
    });
    await prisma.supportTicket.create({
        data: {
            userId: customer.id,
            subject: 'App crashing',
            description: 'Freezes on checkout',
            status: 'open',
            priority: 'high',
        }
    });
    await prisma.payoutRequest.create({
        data: {
            ownerType: 'company',
            ownerId: comp.id,
            amount: 500.00,
            status: 'pending',
            destinationBank: 'Bank of America',
            accountName: 'Cleaning Co',
            accountNumber: '123456789',
        }
    });
    await prisma.auditLog.create({
        data: {
            userId: admin.id,
            action: 'UPDATE_SETTINGS',
            entityType: 'SystemSettings',
        }
    });
    console.log('✅ Seed completed successfully! Your app is fully populated.');
}
main()
    .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map