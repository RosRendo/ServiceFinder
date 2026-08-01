import { Module, forwardRef } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BookingsGateway } from './bookings.gateway';
import { AdminModule } from '../admin/admin.module';
import { SettingsModule } from '../settings/settings.module';

import { NotificationsModule } from '../notifications/notifications.module';
import { PromoCodesModule } from '../promo-codes/promo-codes.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { BookingListener } from './listeners/booking.listener';

@Module({
  imports: [
    PrismaModule,
    SettingsModule,
    NotificationsModule,
    PromoCodesModule,
    forwardRef(() => AdminModule),
    forwardRef(() => ConversationsModule),
  ],
  providers: [BookingsService, BookingsGateway, BookingListener],
  controllers: [BookingsController],
  exports: [BookingsService, BookingsGateway],
})
export class BookingsModule {}
