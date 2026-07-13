import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LocationGateway } from './location.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [LocationController],
  providers: [LocationGateway],
})
export class LocationModule {}
