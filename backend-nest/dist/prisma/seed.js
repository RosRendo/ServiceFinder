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
async function runProductionSeed() {
    console.log('🌱 Starting PRODUCTION safe seed...');
    const pw = await bcrypt.hash('password123', 10);
    const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@servicefinder.com' } });
    if (!existingAdmin) {
        console.log('  -> Creating initial Super Admin account...');
        await prisma.user.create({
            data: { fullName: 'Super Admin', email: 'admin@servicefinder.com', passwordHash: pw, role: 'admin', phone: '+1000000000', status: 'active' }
        });
    }
    else {
        console.log('  -> Super Admin already exists. Skipping.');
    }
    console.log('  -> Ensuring default categories exist...');
    const categoriesData = ['Cleaning', 'Plumbing', 'Electrical', 'Landscaping', 'HVAC'];
    for (let i = 0; i < categoriesData.length; i++) {
        const slug = categoriesData[i].toLowerCase();
        const existing = await prisma.category.findUnique({ where: { slug } });
        if (!existing) {
            await prisma.category.create({
                data: { name: categoriesData[i], slug, displayOrder: i, status: 'active' }
            });
        }
    }
    console.log('✅ PRODUCTION SEED COMPLETED SAFELY.');
}
async function runMassiveSeed() {
    console.log('🌱 Starting massive full-app database seed...');
    console.log('🧹 Clearing existing data... (This may take a few seconds)');
    const tables = await prisma.$queryRaw `
    SELECT tablename FROM pg_tables WHERE schemaname='public';
  `;
    for (const { tablename } of tables) {
        if (tablename !== '_prisma_migrations') {
            try {
                await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
            }
            catch (error) {
                console.log(`Failed to truncate ${tablename}`);
            }
        }
    }
    const pw = await bcrypt.hash('password123', 10);
    console.log('👥 Creating Users (Admin, Staff, Customers)...');
    const admin = await prisma.user.create({
        data: { fullName: 'Super Admin', email: 'admin@servicefinder.com', passwordHash: pw, role: 'admin', phone: '+1000000000', status: 'active' }
    });
    const owners = [];
    for (let i = 1; i <= 3; i++) {
        owners.push(await prisma.user.create({
            data: { fullName: `Company Owner ${i}`, email: `owner${i}@demo.com`, passwordHash: pw, role: 'company_admin', phone: `+111111111${i}`, status: 'active' }
        }));
    }
    const staff = [];
    for (let i = 1; i <= 15; i++) {
        staff.push(await prisma.user.create({
            data: { fullName: `Staff Member ${i}`, email: `staff${i}@demo.com`, passwordHash: pw, role: 'staff', phone: `+22222222${i.toString().padStart(2, '0')}`, status: 'active', workingStatus: i % 3 === 0 ? 'offline' : 'active' }
        }));
    }
    const customers = [];
    for (let i = 1; i <= 30; i++) {
        customers.push(await prisma.user.create({
            data: { fullName: `Customer ${i}`, email: `customer${i}@demo.com`, passwordHash: pw, role: 'customer', phone: `+33333333${i.toString().padStart(2, '0')}`, status: 'active' }
        }));
    }
    console.log('🏢 Creating Companies & Staff Links...');
    const companies = [];
    companies.push(await prisma.company.create({
        data: { name: 'Cleaning Solutions LLC', ownerId: owners[0].id, phone: '555-0101', email: 'hello@cleaningsolutions.com', address: '123 Sparkle Ave', city: 'New York', verificationStatus: 'verified', bookingMode: 'dispatch' }
    }));
    companies.push(await prisma.company.create({
        data: { name: 'Elite Plumbers', ownerId: owners[1].id, phone: '555-0102', email: 'hello@eliteplumbers.com', address: '456 Pipe St', city: 'Los Angeles', verificationStatus: 'verified', bookingMode: 'open_pool' }
    }));
    companies.push(await prisma.company.create({
        data: { name: 'Quick Fix Electricians', ownerId: owners[2].id, phone: '555-0103', email: 'hello@quickfix.com', address: '789 Wire Blvd', city: 'Chicago', verificationStatus: 'pending', bookingMode: 'dispatch' }
    }));
    const companyStaffLinks = [];
    for (let i = 0; i < staff.length; i++) {
        companyStaffLinks.push(await prisma.companyStaff.create({
            data: { companyId: companies[i % 3].id, userId: staff[i].id, role: 'worker', status: 'active' }
        }));
    }
    console.log('📦 Creating Categories & Services...');
    const categoriesData = ['Cleaning', 'Plumbing', 'Electrical', 'Landscaping', 'HVAC'];
    const categories = [];
    for (let i = 0; i < categoriesData.length; i++) {
        categories.push(await prisma.category.create({
            data: { name: categoriesData[i], slug: categoriesData[i].toLowerCase(), displayOrder: i, status: 'active' }
        }));
    }
    const sType1 = await prisma.serviceType.create({ data: { categoryId: categories[0].id, name: 'Deep Cleaning', slug: 'deep-cleaning', status: 'active' } });
    const sType2 = await prisma.serviceType.create({ data: { categoryId: categories[0].id, name: 'Standard Cleaning', slug: 'standard-cleaning', status: 'active' } });
    const sType3 = await prisma.serviceType.create({ data: { categoryId: categories[1].id, name: 'Pipe Leak Repair', slug: 'pipe-leak', status: 'active' } });
    const companyServices = [];
    companyServices.push(await prisma.service.create({ data: { companyId: companies[0].id, serviceTypeId: sType1.id, name: 'Premium Deep Clean', description: 'Top to bottom clean', basePrice: 150, durationMin: 180, isActive: true } }));
    companyServices.push(await prisma.service.create({ data: { companyId: companies[0].id, serviceTypeId: sType2.id, name: 'Weekly Standard Clean', description: 'Maintenance clean', basePrice: 80, durationMin: 120, isActive: true } }));
    companyServices.push(await prisma.service.create({ data: { companyId: companies[1].id, serviceTypeId: sType3.id, name: 'Emergency Leak Repair', description: '24/7 pipe repair', basePrice: 200, durationMin: 60, isActive: true } }));
    console.log('🎟️ Creating Promo Codes...');
    await prisma.promoCode.create({ data: { code: 'SUMMER20', discountPercent: 20, maxUses: 100, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), isActive: true } });
    await prisma.promoCode.create({ data: { code: 'WELCOME50', discountPercent: 50, maxUses: 50, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), isActive: true } });
    console.log('📅 Generating 60+ Bookings, Payments, and Reviews...');
    const now = new Date();
    for (let i = 0; i < 60; i++) {
        const cust = customers[i % customers.length];
        const comp = companies[i % 2];
        const srv = comp.id === companies[0].id ? companyServices[i % 2] : companyServices[2];
        const stf = staff[i % 5];
        let status = 'completed';
        let bookingDate = new Date(now.getTime() - Math.random() * 60 * 24 * 60 * 60 * 1000);
        if (i < 5) {
            status = 'pending';
            bookingDate = new Date(now.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000);
        }
        else if (i < 10) {
            status = 'confirmed';
            bookingDate = new Date(now.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000);
        }
        else if (i < 15) {
            status = 'in_progress';
            bookingDate = new Date();
        }
        else if (i < 20) {
            status = 'cancelled';
            bookingDate = new Date(now.getTime() - Math.random() * 10 * 24 * 60 * 60 * 1000);
        }
        const price = Number(srv.basePrice) || 100;
        const fee = price * 0.10;
        const cStaff = companyStaffLinks.find(cs => cs.userId === stf.id);
        const b = await prisma.booking.create({
            data: {
                customerId: cust.id,
                companyId: comp.id,
                serviceId: srv.id,
                assignedStaffId: (status === 'pending' || status === 'cancelled' || !cStaff) ? null : cStaff.id,
                status: status,
                bookingDate: bookingDate,
                startTime: new Date(bookingDate.setHours(10, 0, 0, 0)),
                endTime: new Date(bookingDate.setHours(12, 0, 0, 0)),
                totalPrice: price,
                platformFee: fee,
                companyEarnings: price - fee,
                serviceAddress: `${100 + i} Random Street, City`,
                staffNotes: i % 4 === 0 ? 'Please call upon arrival.' : null,
            }
        });
        await prisma.bookingStatusLog.create({
            data: { bookingId: b.id, oldStatus: 'pending', newStatus: status, changedBy: admin.id }
        });
        if (status === 'completed' || status === 'in_progress') {
            await prisma.payment.create({
                data: { bookingId: b.id, userId: cust.id, amount: price, status: status === 'completed' ? 'paid' : 'pending', method: 'card', transactionRef: `pi_test_${b.id}` }
            });
            await prisma.invoice.create({
                data: { bookingId: b.id, invoiceNumber: `INV-${b.id}-${now.getFullYear()}`, totalAmount: price, issuedAt: b.createdAt }
            });
            if (status === 'completed' && i % 2 === 0) {
                const rating = Math.floor(Math.random() * 3) + 3;
                await prisma.review.create({
                    data: { bookingId: b.id, customerId: cust.id, companyRating: rating, companyComment: `Great service, very professional! (Rating: ${rating})` }
                });
            }
        }
    }
    console.log('⚖️ Creating Disputes & Moderation Logs...');
    const firstCompleted = await prisma.booking.findFirst({ where: { status: 'completed' } });
    if (firstCompleted) {
        await prisma.dispute.create({
            data: { bookingId: firstCompleted.id, customerId: customers[0].id, companyId: companies[0].id, type: 'incomplete', description: 'Service was incomplete', status: 'open' }
        });
    }
    for (let i = 0; i < 10; i++) {
        await prisma.moderationLog.create({
            data: { adminId: admin.id, entityType: 'review', entityId: BigInt(i + 1), action: 'flagged', reason: 'Inappropriate language detected' }
        });
        await prisma.supportTicket.create({
            data: { userId: customers[i].id, subject: `Help with booking ${i}`, description: 'I need to reschedule.', status: i % 2 === 0 ? 'open' : 'closed', priority: 'medium' }
        });
    }
    await prisma.complianceReport.create({
        data: { companyId: companies[0].id, type: 'kyb_verification', status: 'approved', notes: 'All business documents verified.' }
    });
    await prisma.complianceReport.create({
        data: { companyId: companies[2].id, type: 'kyb_verification', status: 'pending', notes: 'Awaiting business license.' }
    });
    console.log('💰 Creating Wallet Transactions & Payouts...');
    for (let i = 0; i < 5; i++) {
        await prisma.payoutRequest.create({
            data: { ownerType: 'company', ownerId: companies[0].id, amount: 500 + (i * 100), status: i === 0 ? 'pending' : 'paid', destinationBank: 'Bank of America', accountName: 'John Doe', accountNumber: '123456789' }
        });
    }
    for (let i = 0; i < 20; i++) {
        await prisma.transaction.create({
            data: { ownerType: 'company', ownerId: companies[0].id, type: 'earning', amount: 135.00, category: `earning`, description: 'Booking Earning' }
        });
    }
    console.log('📝 Creating Admin Audit Logs...');
    for (let i = 0; i < 15; i++) {
        await prisma.auditLog.create({
            data: { userId: admin.id, action: 'UPDATE_SETTINGS', entityType: 'SystemSetting', entityId: BigInt(1) }
        });
    }
    console.log('✅ MASSIVE SEED COMPLETED SUCCESSFULLY! Your app is fully populated.');
}
async function main() {
    if (process.env.NODE_ENV === 'production') {
        await runProductionSeed();
    }
    else {
        if (process.env.SAFE_SEED === 'true') {
            await runProductionSeed();
        }
        else {
            await runMassiveSeed();
        }
    }
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