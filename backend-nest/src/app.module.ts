import { createClient } from 'redis';
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { EventEmitterModule } from '@nestjs/event-emitter';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { MailModule } from './mail/mail.module';
import { CategoriesModule } from './categories/categories.module';
import { ServiceTypesModule } from './service-types/service-types.module';
import { ServicesModule } from './services/services.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SavedItemsModule } from './saved-items/saved-items.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { HealthModule } from './health/health.module';
import { ConversationsModule } from './conversations/conversations.module';
import { AddressesModule } from './addresses/addresses.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { SettingsModule } from './settings/settings.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { LocationModule } from './location/location.module';
import { AdminModule } from './admin/admin.module';
import { DisputesModule } from './disputes/disputes.module';
import { StaffModule } from './staff/staff.module';
import { PayoutsModule } from './payouts/payouts.module';
import { SearchModule } from './search/search.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UploadModule } from './upload/upload.module';
import { AuditModule } from './audit/audit.module';
import { WalletsModule } from './wallets/wallets.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { FinancialsModule } from './financials/financials.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { PromoCodesModule } from './promo-codes/promo-codes.module';
import { PricingRulesModule } from './pricing-rules/pricing-rules.module';
import { SupportModule } from './support/support.module';
import { ModerationModule } from './moderation/moderation.module';
import { ComplianceModule } from './compliance/compliance.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(5000),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().default('7d'),
        REDIS_URL: Joi.string().optional().allow(''),
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        let storage: any = undefined;

        if (redisUrl) {
          const testClient = createClient({
            url: redisUrl,
            socket: { connectTimeout: 1000, reconnectStrategy: false },
          });
          testClient.on('error', () => {});
          try {
            await testClient.connect();
            await testClient.ping();
            await testClient.disconnect();

            const {
              ThrottlerStorageRedisService,
            } = require('nestjs-throttler-storage-redis');
            storage = new ThrottlerStorageRedisService(redisUrl);
          } catch {
            console.warn(
              '⚠️ Redis rate limiter unavailable, falling back to in-memory throttler',
            );
          }
        }

        return {
          throttlers: [
            {
              name: 'short',
              ttl: 1000,
              limit: 30,
            },
            {
              name: 'medium',
              ttl: 60000,
              limit: 300,
            },
          ],
          storage,
        };
      },
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const redisUrl = process.env.REDIS_URL;
        if (redisUrl) {
          const testClient = createClient({
            url: redisUrl,
            socket: {
              connectTimeout: 1000,
              reconnectStrategy: false,
            },
          });
          testClient.on('error', () => {});
          try {
            await testClient.connect();
            await testClient.ping();
            await testClient.disconnect();
            return {
              store: await redisStore({
                url: redisUrl,
                ttl: 60 * 60 * 1000,
              }),
            };
          } catch (error: any) {
            console.warn(
              '⚠️ Redis connection unavailable, falling back to in-memory cache:',
              error?.message || error,
            );
          }
        }
        // Fallback to in-memory cache if Redis is unavailable
        return {
          ttl: 60 * 60 * 1000,
        };
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    MailModule,
    CategoriesModule,
    ServiceTypesModule,
    ServicesModule,
    ReviewsModule,
    SavedItemsModule,
    BookingsModule,
    PaymentsModule,
    HealthModule,
    ConversationsModule,
    AddressesModule,
    AuditLogsModule,
    SettingsModule,
    LocationModule,
    AdminModule,
    DisputesModule,
    StaffModule,
    PayoutsModule,
    SearchModule,
    NotificationsModule,
    UploadModule,
    AuditModule,
    WalletsModule,
    AnalyticsModule,
    FinancialsModule,
    WebhooksModule,
    PromoCodesModule,
    PricingRulesModule,
    SupportModule,
    ModerationModule,
    ComplianceModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
