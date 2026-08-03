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
var bcrypt = require("bcrypt");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var tables, _i, tables_1, tablename, error_1, pw, admin, owners, i, _a, _b, staff, i, _c, _d, customers, i, _e, _f, companies, _g, _h, _j, _k, _l, _m, i, categoriesData, categories, i, _o, _p, sType1, sType2, sType3, companyServices, _q, _r, _s, _t, _u, _v, now, i, cust, comp, srv, stf, status_1, bookingDate, price, fee, b, rating, firstCompleted, i, i, i, i;
        return __generator(this, function (_w) {
            switch (_w.label) {
                case 0:
                    console.log('🌱 Starting massive full-app database seed...');
                    console.log('🧹 Clearing existing data... (This may take a few seconds)');
                    return [4 /*yield*/, prisma.$queryRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    SELECT tablename FROM pg_tables WHERE schemaname='public';\n  "], ["\n    SELECT tablename FROM pg_tables WHERE schemaname='public';\n  "])))];
                case 1:
                    tables = _w.sent();
                    _i = 0, tables_1 = tables;
                    _w.label = 2;
                case 2:
                    if (!(_i < tables_1.length)) return [3 /*break*/, 7];
                    tablename = tables_1[_i].tablename;
                    if (!(tablename !== '_prisma_migrations')) return [3 /*break*/, 6];
                    _w.label = 3;
                case 3:
                    _w.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, prisma.$executeRawUnsafe("TRUNCATE TABLE \"".concat(tablename, "\" CASCADE;"))];
                case 4:
                    _w.sent();
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _w.sent();
                    console.log("Failed to truncate ".concat(tablename));
                    return [3 /*break*/, 6];
                case 6:
                    _i++;
                    return [3 /*break*/, 2];
                case 7: return [4 /*yield*/, bcrypt.hash('password123', 10)];
                case 8:
                    pw = _w.sent();
                    // 1. CREATE USERS
                    console.log('👥 Creating Users (Admin, Staff, Customers)...');
                    return [4 /*yield*/, prisma.user.create({
                            data: { fullName: 'Super Admin', email: 'admin@servicefinder.com', passwordHash: pw, role: 'admin', phone: '+1000000000', status: 'active' }
                        })];
                case 9:
                    admin = _w.sent();
                    owners = [];
                    i = 1;
                    _w.label = 10;
                case 10:
                    if (!(i <= 3)) return [3 /*break*/, 13];
                    _b = (_a = owners).push;
                    return [4 /*yield*/, prisma.user.create({
                            data: { fullName: "Company Owner ".concat(i), email: "owner".concat(i, "@demo.com"), passwordHash: pw, role: 'company_admin', phone: "+111111111".concat(i), status: 'active' }
                        })];
                case 11:
                    _b.apply(_a, [_w.sent()]);
                    _w.label = 12;
                case 12:
                    i++;
                    return [3 /*break*/, 10];
                case 13:
                    staff = [];
                    i = 1;
                    _w.label = 14;
                case 14:
                    if (!(i <= 15)) return [3 /*break*/, 17];
                    _d = (_c = staff).push;
                    return [4 /*yield*/, prisma.user.create({
                            data: { fullName: "Staff Member ".concat(i), email: "staff".concat(i, "@demo.com"), passwordHash: pw, role: 'staff', phone: "+22222222".concat(i.toString().padStart(2, '0')), status: 'active', workingStatus: i % 3 === 0 ? 'offline' : 'active' }
                        })];
                case 15:
                    _d.apply(_c, [_w.sent()]);
                    _w.label = 16;
                case 16:
                    i++;
                    return [3 /*break*/, 14];
                case 17:
                    customers = [];
                    i = 1;
                    _w.label = 18;
                case 18:
                    if (!(i <= 30)) return [3 /*break*/, 21];
                    _f = (_e = customers).push;
                    return [4 /*yield*/, prisma.user.create({
                            data: { fullName: "Customer ".concat(i), email: "customer".concat(i, "@demo.com"), passwordHash: pw, role: 'customer', phone: "+33333333".concat(i.toString().padStart(2, '0')), status: 'active' }
                        })];
                case 19:
                    _f.apply(_e, [_w.sent()]);
                    _w.label = 20;
                case 20:
                    i++;
                    return [3 /*break*/, 18];
                case 21:
                    // 2. CREATE COMPANIES
                    console.log('🏢 Creating Companies & Staff Links...');
                    companies = [];
                    _h = (_g = companies).push;
                    return [4 /*yield*/, prisma.company.create({
                            data: { name: 'Cleaning Solutions LLC', ownerId: owners[0].id, phone: '555-0101', email: 'hello@cleaningsolutions.com', address: '123 Sparkle Ave', city: 'New York', verificationStatus: 'verified', bookingMode: 'dispatch' }
                        })];
                case 22:
                    _h.apply(_g, [_w.sent()]);
                    _k = (_j = companies).push;
                    return [4 /*yield*/, prisma.company.create({
                            data: { name: 'Elite Plumbers', ownerId: owners[1].id, phone: '555-0102', email: 'hello@eliteplumbers.com', address: '456 Pipe St', city: 'Los Angeles', verificationStatus: 'verified', bookingMode: 'open_pool' }
                        })];
                case 23:
                    _k.apply(_j, [_w.sent()]);
                    _m = (_l = companies).push;
                    return [4 /*yield*/, prisma.company.create({
                            data: { name: 'Quick Fix Electricians', ownerId: owners[2].id, phone: '555-0103', email: 'hello@quickfix.com', address: '789 Wire Blvd', city: 'Chicago', verificationStatus: 'pending', bookingMode: 'dispatch' }
                        })];
                case 24:
                    _m.apply(_l, [_w.sent()]);
                    i = 0;
                    _w.label = 25;
                case 25:
                    if (!(i < staff.length)) return [3 /*break*/, 28];
                    return [4 /*yield*/, prisma.companyStaff.create({
                            data: { companyId: companies[i % 3].id, userId: staff[i].id, role: 'worker', status: 'active' }
                        })];
                case 26:
                    _w.sent();
                    _w.label = 27;
                case 27:
                    i++;
                    return [3 /*break*/, 25];
                case 28:
                    // 3. CREATE CATEGORIES & SERVICES
                    console.log('📦 Creating Categories & Services...');
                    categoriesData = ['Cleaning', 'Plumbing', 'Electrical', 'Landscaping', 'HVAC'];
                    categories = [];
                    i = 0;
                    _w.label = 29;
                case 29:
                    if (!(i < categoriesData.length)) return [3 /*break*/, 32];
                    _p = (_o = categories).push;
                    return [4 /*yield*/, prisma.category.create({
                            data: { name: categoriesData[i], slug: categoriesData[i].toLowerCase(), displayOrder: i, status: 'active' }
                        })];
                case 30:
                    _p.apply(_o, [_w.sent()]);
                    _w.label = 31;
                case 31:
                    i++;
                    return [3 /*break*/, 29];
                case 32: return [4 /*yield*/, prisma.serviceType.create({ data: { categoryId: categories[0].id, name: 'Deep Cleaning', slug: 'deep-cleaning', status: 'active' } })];
                case 33:
                    sType1 = _w.sent();
                    return [4 /*yield*/, prisma.serviceType.create({ data: { categoryId: categories[0].id, name: 'Standard Cleaning', slug: 'standard-cleaning', status: 'active' } })];
                case 34:
                    sType2 = _w.sent();
                    return [4 /*yield*/, prisma.serviceType.create({ data: { categoryId: categories[1].id, name: 'Pipe Leak Repair', slug: 'pipe-leak', status: 'active' } })];
                case 35:
                    sType3 = _w.sent();
                    companyServices = [];
                    _r = (_q = companyServices).push;
                    return [4 /*yield*/, prisma.service.create({ data: { companyId: companies[0].id, serviceTypeId: sType1.id, name: 'Premium Deep Clean', description: 'Top to bottom clean', basePrice: 150, durationMin: 180, isActive: true } })];
                case 36:
                    _r.apply(_q, [_w.sent()]);
                    _t = (_s = companyServices).push;
                    return [4 /*yield*/, prisma.service.create({ data: { companyId: companies[0].id, serviceTypeId: sType2.id, name: 'Weekly Standard Clean', description: 'Maintenance clean', basePrice: 80, durationMin: 120, isActive: true } })];
                case 37:
                    _t.apply(_s, [_w.sent()]);
                    _v = (_u = companyServices).push;
                    return [4 /*yield*/, prisma.service.create({ data: { companyId: companies[1].id, serviceTypeId: sType3.id, name: 'Emergency Leak Repair', description: '24/7 pipe repair', basePrice: 200, durationMin: 60, isActive: true } })];
                case 38:
                    _v.apply(_u, [_w.sent()]);
                    // 4. CREATE PROMO CODES
                    console.log('🎟️ Creating Promo Codes...');
                    return [4 /*yield*/, prisma.promoCode.create({ data: { code: 'SUMMER20', discountPercent: 20, maxUses: 100, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), isActive: true } })];
                case 39:
                    _w.sent();
                    return [4 /*yield*/, prisma.promoCode.create({ data: { code: 'WELCOME50', discountPercent: 50, maxUses: 50, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), isActive: true } })];
                case 40:
                    _w.sent();
                    // 5. CREATE MASSIVE BOOKINGS
                    console.log('📅 Generating 60+ Bookings, Payments, and Reviews...');
                    now = new Date();
                    i = 0;
                    _w.label = 41;
                case 41:
                    if (!(i < 60)) return [3 /*break*/, 48];
                    cust = customers[i % customers.length];
                    comp = companies[i % 2];
                    srv = comp.id === companies[0].id ? companyServices[i % 2] : companyServices[2];
                    stf = staff[i % 5];
                    status_1 = 'completed';
                    bookingDate = new Date(now.getTime() - Math.random() * 60 * 24 * 60 * 60 * 1000);
                    if (i < 5) {
                        status_1 = 'pending';
                        bookingDate = new Date(now.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000); // Future 5 days
                    }
                    else if (i < 10) {
                        status_1 = 'accepted';
                        bookingDate = new Date(now.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000);
                    }
                    else if (i < 15) {
                        status_1 = 'in_progress';
                        bookingDate = new Date(); // Today
                    }
                    else if (i < 20) {
                        status_1 = 'cancelled';
                        bookingDate = new Date(now.getTime() - Math.random() * 10 * 24 * 60 * 60 * 1000);
                    }
                    price = Number(srv.basePrice) || 100;
                    fee = price * 0.10;
                    return [4 /*yield*/, prisma.booking.create({
                            data: {
                                customerId: cust.id,
                                companyId: comp.id,
                                serviceId: srv.id,
                                assignedStaffId: (status_1 === 'pending' || status_1 === 'cancelled') ? null : stf.id,
                                status: status_1,
                                bookingDate: bookingDate,
                                startTime: new Date(bookingDate.setHours(10, 0, 0, 0)),
                                endTime: new Date(bookingDate.setHours(12, 0, 0, 0)),
                                totalPrice: price,
                                platformFee: fee,
                                companyEarnings: price - fee,
                                serviceAddress: "".concat(100 + i, " Random Street, City"),
                                staffNotes: i % 4 === 0 ? 'Please call upon arrival.' : null,
                            }
                        })];
                case 42:
                    b = _w.sent();
                    // Create Booking Status Log
                    return [4 /*yield*/, prisma.bookingStatusLog.create({
                            data: { bookingId: b.id, oldStatus: 'pending', newStatus: status_1, changedBy: admin.id }
                        })];
                case 43:
                    // Create Booking Status Log
                    _w.sent();
                    if (!(status_1 === 'completed' || status_1 === 'in_progress')) return [3 /*break*/, 47];
                    return [4 /*yield*/, prisma.payment.create({
                            data: { bookingId: b.id, userId: cust.id, amount: price, status: status_1 === 'completed' ? 'paid' : 'pending', method: 'card', transactionRef: "pi_test_".concat(b.id) }
                        })];
                case 44:
                    _w.sent();
                    return [4 /*yield*/, prisma.invoice.create({
                            data: { bookingId: b.id, invoiceNumber: "INV-".concat(b.id, "-").concat(now.getFullYear()), totalAmount: price, issuedAt: b.createdAt }
                        })];
                case 45:
                    _w.sent();
                    if (!(status_1 === 'completed' && i % 2 === 0)) return [3 /*break*/, 47];
                    rating = Math.floor(Math.random() * 3) + 3;
                    return [4 /*yield*/, prisma.review.create({
                            data: { bookingId: b.id, customerId: cust.id, companyRating: rating, companyComment: "Great service, very professional! (Rating: ".concat(rating, ")") }
                        })];
                case 46:
                    _w.sent();
                    _w.label = 47;
                case 47:
                    i++;
                    return [3 /*break*/, 41];
                case 48:
                    // 7. CREATE DISPUTES, MODERATION, COMPLIANCE
                    console.log('⚖️ Creating Disputes & Moderation Logs...');
                    return [4 /*yield*/, prisma.booking.findFirst({ where: { status: 'completed' } })];
                case 49:
                    firstCompleted = _w.sent();
                    if (!firstCompleted) return [3 /*break*/, 51];
                    return [4 /*yield*/, prisma.dispute.create({
                            data: { bookingId: firstCompleted.id, customerId: customers[0].id, companyId: companies[0].id, type: 'incomplete', description: 'Service was incomplete', status: 'open' }
                        })];
                case 50:
                    _w.sent();
                    _w.label = 51;
                case 51:
                    i = 0;
                    _w.label = 52;
                case 52:
                    if (!(i < 10)) return [3 /*break*/, 56];
                    return [4 /*yield*/, prisma.moderationLog.create({
                            data: { adminId: admin.id, entityType: 'review', entityId: BigInt(i + 1), action: 'flagged', reason: 'Inappropriate language detected' }
                        })];
                case 53:
                    _w.sent();
                    return [4 /*yield*/, prisma.supportTicket.create({
                            data: { userId: customers[i].id, subject: "Help with booking ".concat(i), description: 'I need to reschedule.', status: i % 2 === 0 ? 'open' : 'closed', priority: 'medium' }
                        })];
                case 54:
                    _w.sent();
                    _w.label = 55;
                case 55:
                    i++;
                    return [3 /*break*/, 52];
                case 56: return [4 /*yield*/, prisma.complianceReport.create({
                        data: { companyId: companies[0].id, type: 'kyb_verification', status: 'approved', notes: 'All business documents verified.' }
                    })];
                case 57:
                    _w.sent();
                    return [4 /*yield*/, prisma.complianceReport.create({
                            data: { companyId: companies[2].id, type: 'kyb_verification', status: 'pending', notes: 'Awaiting business license.' }
                        })];
                case 58:
                    _w.sent();
                    // 8. CREATE TRANSACTIONS & PAYOUTS
                    console.log('💰 Creating Wallet Transactions & Payouts...');
                    i = 0;
                    _w.label = 59;
                case 59:
                    if (!(i < 5)) return [3 /*break*/, 62];
                    return [4 /*yield*/, prisma.payoutRequest.create({
                            data: { ownerType: 'company', ownerId: companies[0].id, amount: 500 + (i * 100), status: i === 0 ? 'pending' : 'paid', destinationBank: 'Bank of America', accountName: 'John Doe', accountNumber: '123456789' }
                        })];
                case 60:
                    _w.sent();
                    _w.label = 61;
                case 61:
                    i++;
                    return [3 /*break*/, 59];
                case 62:
                    i = 0;
                    _w.label = 63;
                case 63:
                    if (!(i < 20)) return [3 /*break*/, 66];
                    return [4 /*yield*/, prisma.transaction.create({
                            data: { ownerType: 'company', ownerId: companies[0].id, type: 'earning', amount: 135.00, category: "earning", description: 'Booking Earning' }
                        })];
                case 64:
                    _w.sent();
                    _w.label = 65;
                case 65:
                    i++;
                    return [3 /*break*/, 63];
                case 66:
                    // 9. CREATE AUDIT LOGS
                    console.log('📝 Creating Admin Audit Logs...');
                    i = 0;
                    _w.label = 67;
                case 67:
                    if (!(i < 15)) return [3 /*break*/, 70];
                    return [4 /*yield*/, prisma.auditLog.create({
                            data: { userId: admin.id, action: 'UPDATE_SETTINGS', entityType: 'SystemSetting', entityId: BigInt(1) }
                        })];
                case 68:
                    _w.sent();
                    _w.label = 69;
                case 69:
                    i++;
                    return [3 /*break*/, 67];
                case 70:
                    console.log('✅ MASSIVE SEED COMPLETED SUCCESSFULLY! Your app is fully populated.');
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
