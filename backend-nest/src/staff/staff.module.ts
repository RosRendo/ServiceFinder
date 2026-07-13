import { Module } from '@nestjs/common';
import { StaffPerformanceController } from './staff-performance.controller';
import { StaffPerformanceService } from './staff-performance.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [StaffPerformanceController],
  providers: [StaffPerformanceService],
  exports: [StaffPerformanceService],
})
export class StaffModule {}
