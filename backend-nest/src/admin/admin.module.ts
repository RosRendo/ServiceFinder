import { Module, forwardRef } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminGateway } from './admin.gateway';
import { BookingsModule } from '../bookings/bookings.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    forwardRef(() => BookingsModule),
    MailModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGateway],
  exports: [AdminService, AdminGateway],
})
export class AdminModule {}
