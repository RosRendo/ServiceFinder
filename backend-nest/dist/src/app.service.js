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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma/prisma.service");
let AppService = class AppService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getHello() {
        return 'Hello World!';
    }
    async getLiveStats() {
        const [totalPros, bookingsToday, avgResponseTime] = await Promise.all([
            this.prisma.companyStaff.count({ where: { status: 'active' } }),
            this.prisma.booking.count({
                where: {
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                },
            }),
            Promise.resolve(Math.floor(Math.random() * 10) + 2),
        ]);
        const recentBookings = await this.prisma.booking.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                customer: { select: { fullName: true } },
                service: { select: { name: true } },
                company: { select: { city: true } },
            },
        });
        const formattedTicker = recentBookings.map((b) => {
            const customerName = b.customer?.fullName?.split(' ')[0] || 'A user';
            return `${customerName} just booked ${b.service?.name || 'a service'} in ${b.company?.city || 'their city'}`;
        });
        const finalTicker = formattedTicker.length > 0
            ? formattedTicker
            : [
                'Sarah just booked Deep Clean in Downtown',
                'Mike just booked AC Repair in Westside',
                'Emma just booked Smart Home Setup in North Hills',
            ];
        return {
            stats: [
                { label: 'Active Professionals', value: totalPros.toLocaleString() },
                { label: 'Bookings Today', value: bookingsToday.toLocaleString() },
                { label: 'Avg Response Time', value: `${avgResponseTime} min` },
            ],
            tickerItems: finalTicker,
        };
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppService);
//# sourceMappingURL=app.service.js.map