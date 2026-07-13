// @ts-nocheck
import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { CloudinaryProvider } from '../config/cloudinary.config';

@Module({
  controllers: [CompaniesController],
  providers: [CompaniesService, CloudinaryProvider],
  exports: [CloudinaryProvider],
})
export class CompaniesModule {}

