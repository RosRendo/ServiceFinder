import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InstantRequestsService } from './instant-requests.service';
import { InstantRequestsController } from './instant-requests.controller';
import { InstantRequestsGateway } from './instant-requests.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [InstantRequestsController],
  providers: [InstantRequestsService, InstantRequestsGateway],
  exports: [InstantRequestsService],
})
export class InstantRequestsModule {}
