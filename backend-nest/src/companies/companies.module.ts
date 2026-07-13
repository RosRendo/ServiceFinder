import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { CloudinaryProvider } from '../config/cloudinary.config';
import { MailModule } from '../mail/mail.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [MailModule, SettingsModule],
  controllers: [CompaniesController],
  providers: [CompaniesService, CloudinaryProvider],
  exports: [CloudinaryProvider],
})
export class CompaniesModule {}
