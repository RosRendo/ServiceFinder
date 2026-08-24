import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  /**
   * Public aggregate stats. Deliberately returns ONLY counts:
   * no customer names, no booking-level rows. (The old version exposed
   * recent customers' first names and fabricated mock tickers.)
   */
  async getLiveStats() {
    const [totalPros, bookingsToday] = await Promise.all([
      this.prisma.companyStaff.count({ where: { status: 'active' } }),
      this.prisma.booking.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return {
      stats: [
        { label: 'Active Professionals', value: totalPros.toLocaleString() },
        { label: 'Bookings Today', value: bookingsToday.toLocaleString() },
      ],
    };
  }
}
