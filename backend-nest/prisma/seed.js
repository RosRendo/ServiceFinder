"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcrypt = require("bcryptjs");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var tableNames, _i, tableNames_1, tablename, error_1, pw, cat, stype, admin, owner, staff, customer, comp, srv, tomorrow, yesterday, b3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🌱 Starting full database seed...');
                    console.log('🧹 Clearing existing data...');
                    return [4 /*yield*/, prisma.$queryRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["SELECT tablename FROM pg_tables WHERE schemaname='public'"], ["SELECT tablename FROM pg_tables WHERE schemaname='public'"])))];
                case 1:
                    tableNames = _a.sent();
                    _i = 0, tableNames_1 = tableNames;
                    _a.label = 2;
                case 2:
                    if (!(_i < tableNames_1.length)) return [3 /*break*/, 7];
                    tablename = tableNames_1[_i].tablename;
                    if (!(tablename !== '_prisma_migrations')) return [3 /*break*/, 6];
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, prisma.$executeRawUnsafe("TRUNCATE TABLE \"".concat(tablename, "\" CASCADE;"))];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    return [3 /*break*/, 6];
                case 6:
                    _i++;
                    return [3 /*break*/, 2];
                case 7: return [4 /*yield*/, bcrypt.hash('password123', 10)];
                case 8:
                    pw = _a.sent();
                    console.log('📦 Creating Categories & Service Types...');
                    return [4 /*yield*/, prisma.category.create({
                            data: { name: 'Cleaning', slug: 'cleaning', displayOrder: 1, status: 'active' }
                        })];
                case 9:
                    cat = _a.sent();
                    return [4 /*yield*/, prisma.serviceType.create({
                            data: { categoryId: cat.id, name: 'Deep Cleaning', slug: 'deep-cleaning', status: 'active' }
                        })];
                case 10:
                    stype = _a.sent();
                    console.log('👥 Creating Users...');
                    return [4 /*yield*/, prisma.user.create({
                            data: { fullName: 'Super Admin', email: 'admin@servicefinder.com', passwordHash: pw, role: 'admin', phone: '+1000000000', status: 'active' }
                        })];
                case 11:
                    admin = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: { fullName: 'Sarah Jennings', email: 'owner1@cleaningsolutions.com', passwordHash: pw, role: 'company_admin', phone: '+1111111111', status: 'active' }
                        })];
                case 12:
                    owner = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: { fullName: 'Jenny Clean', email: 'staff1@demo.com', passwordHash: pw, role: 'staff', phone: '+3333333331', status: 'active' }
                        })];
                case 13:
                    staff = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: { fullName: 'Alice Wonderland', email: 'customer1@demo.com', passwordHash: pw, role: 'customer', phone: '+4444444441', status: 'active' }
                        })];
                case 14:
                    customer = _a.sent();
                    console.log('🏢 Creating Companies & Services...');
                    return [4 /*yield*/, prisma.company.create({
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
                        })];
                case 15:
                    comp = _a.sent();
                    return [4 /*yield*/, prisma.companyStaff.create({
                            data: { companyId: comp.id, userId: staff.id, role: 'worker', status: 'active' }
                        })];
                case 16:
                    _a.sent();
                    return [4 /*yield*/, prisma.service.create({
                            data: {
                                companyId: comp.id,
                                serviceTypeId: stype.id,
                                name: 'Full House Deep Clean',
                                basePrice: 150.00,
                                durationMin: 180,
                                isActive: true,
                            }
                        })];
                case 17:
                    srv = _a.sent();
                    console.log('📅 Creating Bookings & Finance Records...');
                    tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    return [4 /*yield*/, prisma.booking.create({
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
                        })];
                case 18:
                    _a.sent();
                    return [4 /*yield*/, prisma.booking.create({
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
                        })];
                case 19:
                    b3 = _a.sent();
                    return [4 /*yield*/, prisma.payment.create({
                            data: {
                                bookingId: b3.id,
                                userId: customer.id,
                                amount: 150.00,
                                currency: 'USD',
                                status: 'paid',
                                method: 'card',
                                transactionRef: 'pi_demo_123',
                            }
                        })];
                case 20:
                    _a.sent();
                    return [4 /*yield*/, prisma.invoice.create({
                            data: {
                                bookingId: b3.id,
                                invoiceNumber: 'INV-001',
                                totalAmount: 150.00,
                            }
                        })];
                case 21:
                    _a.sent();
                    return [4 /*yield*/, prisma.review.create({
                            data: {
                                bookingId: b3.id,
                                customerId: customer.id,
                                companyRating: 5,
                                companyComment: 'Amazing service!',
                            }
                        })];
                case 22:
                    _a.sent();
                    console.log('🛡️ Creating Moderation & Support Data...');
                    return [4 /*yield*/, prisma.dispute.create({
                            data: {
                                bookingId: b3.id,
                                customerId: customer.id,
                                companyId: comp.id,
                                description: 'Staff broke a vase.',
                                status: 'open',
                                type: 'damage',
                            }
                        })];
                case 23:
                    _a.sent();
                    return [4 /*yield*/, prisma.moderationLog.create({
                            data: {
                                adminId: admin.id,
                                entityType: 'review',
                                entityId: BigInt(9999),
                                action: 'delete',
                                reason: 'Profanity',
                            }
                        })];
                case 24:
                    _a.sent();
                    return [4 /*yield*/, prisma.complianceReport.create({
                            data: {
                                companyId: comp.id,
                                type: 'KYC',
                                status: 'pending',
                                notes: 'Needs manual review',
                            }
                        })];
                case 25:
                    _a.sent();
                    return [4 /*yield*/, prisma.supportTicket.create({
                            data: {
                                userId: customer.id,
                                subject: 'App crashing',
                                description: 'Freezes on checkout',
                                status: 'open',
                                priority: 'high',
                            }
                        })];
                case 26:
                    _a.sent();
                    return [4 /*yield*/, prisma.payoutRequest.create({
                            data: {
                                ownerType: 'company',
                                ownerId: comp.id,
                                amount: 500.00,
                                status: 'pending',
                                destinationBank: 'Bank of America',
                                accountName: 'Cleaning Co',
                                accountNumber: '123456789',
                            }
                        })];
                case 27:
                    _a.sent();
                    return [4 /*yield*/, prisma.auditLog.create({
                            data: {
                                userId: admin.id,
                                action: 'UPDATE_SETTINGS',
                                entityType: 'SystemSettings',
                            }
                        })];
                case 28:
                    _a.sent();
                    console.log('✅ Seed completed successfully! Your app is fully populated.');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
var templateObject_1;
