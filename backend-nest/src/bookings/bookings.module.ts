import { Module, forwardRef } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BookingsGateway } from './bookings.gateway';
import { AdminModule } from '../admin/admin.module';
import { SettingsModule } from '../settings/settings.module';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    SettingsModule,
    NotificationsModule,
    forwardRef(() => AdminModule),
  ],
  providers: [BookingsService, BookingsGateway],
  controllers: [BookingsController],
  exports: [BookingsService, BookingsGateway],
})
export class BookingsModule {}
