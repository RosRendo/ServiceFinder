import { Module } from '@nestjs/common';
import { PayoutsController } from './payouts.controller';
import { StaffPayoutsController } from './staff-payouts.controller';
import { AdminPayoutsController } from './admin-payouts.controller';
import { PayoutsService } from './payouts.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    PayoutsController,
    StaffPayoutsController,
    AdminPayoutsController,
  ],
  providers: [PayoutsService],
  exports: [PayoutsService],
})
export class PayoutsModule {}
