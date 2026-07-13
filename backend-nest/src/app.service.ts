import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  getHello(): string {
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
      // Mock average response time as we don't track message exact timestamps properly yet
      Promise.resolve(Math.floor(Math.random() * 10) + 2), // 2 to 11 minutes
    ]);

    // Get 5 recent bookings to use for ticker items
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

    // If no bookings exist (fresh db), supply mock tickers
    const finalTicker =
      formattedTicker.length > 0
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
}
