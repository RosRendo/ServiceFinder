"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const redis_1 = require("redis");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const cache_manager_1 = require("@nestjs/cache-manager");
const cache_manager_redis_yet_1 = require("cache-manager-redis-yet");
const event_emitter_1 = require("@nestjs/event-emitter");
const Joi = __importStar(require("joi"));
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const companies_module_1 = require("./companies/companies.module");
const mail_module_1 = require("./mail/mail.module");
const categories_module_1 = require("./categories/categories.module");
const service_types_module_1 = require("./service-types/service-types.module");
const services_module_1 = require("./services/services.module");
const reviews_module_1 = require("./reviews/reviews.module");
const saved_items_module_1 = require("./saved-items/saved-items.module");
const bookings_module_1 = require("./bookings/bookings.module");
const payments_module_1 = require("./payments/payments.module");
const health_module_1 = require("./health/health.module");
const conversations_module_1 = require("./conversations/conversations.module");
const addresses_module_1 = require("./addresses/addresses.module");
const audit_logs_module_1 = require("./audit-logs/audit-logs.module");
const settings_module_1 = require("./settings/settings.module");
const logger_middleware_1 = require("./common/middleware/logger.middleware");
const location_module_1 = require("./location/location.module");
const admin_module_1 = require("./admin/admin.module");
const disputes_module_1 = require("./disputes/disputes.module");
const staff_module_1 = require("./staff/staff.module");
const payouts_module_1 = require("./payouts/payouts.module");
const search_module_1 = require("./search/search.module");
const notifications_module_1 = require("./notifications/notifications.module");
const upload_module_1 = require("./upload/upload.module");
const audit_module_1 = require("./audit/audit.module");
const wallets_module_1 = require("./wallets/wallets.module");
const analytics_module_1 = require("./analytics/analytics.module");
const financials_module_1 = require("./financials/financials.module");
const webhooks_module_1 = require("./webhooks/webhooks.module");
const promo_codes_module_1 = require("./promo-codes/promo-codes.module");
const pricing_rules_module_1 = require("./pricing-rules/pricing-rules.module");
const support_module_1 = require("./support/support.module");
const moderation_module_1 = require("./moderation/moderation.module");
const compliance_module_1 = require("./compliance/compliance.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(logger_middleware_1.LoggerMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            event_emitter_1.EventEmitterModule.forRoot(),
            config_1.ConfigModule.forRoot({
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
            throttler_1.ThrottlerModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: async (config) => {
                    const redisUrl = config.get('REDIS_URL');
                    let storage = undefined;
                    if (redisUrl) {
                        const testClient = (0, redis_1.createClient)({
                            url: redisUrl,
                            socket: { connectTimeout: 1000, reconnectStrategy: false },
                        });
                        testClient.on('error', () => { });
                        try {
                            await testClient.connect();
                            await testClient.ping();
                            await testClient.disconnect();
                            const { ThrottlerStorageRedisService, } = require('nestjs-throttler-storage-redis');
                            storage = new ThrottlerStorageRedisService(redisUrl);
                        }
                        catch {
                            console.warn('⚠️ Redis rate limiter unavailable, falling back to in-memory throttler');
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
            cache_manager_1.CacheModule.registerAsync({
                isGlobal: true,
                useFactory: async () => {
                    const redisUrl = process.env.REDIS_URL;
                    if (redisUrl) {
                        const testClient = (0, redis_1.createClient)({
                            url: redisUrl,
                            socket: {
                                connectTimeout: 1000,
                                reconnectStrategy: false,
                            },
                        });
                        testClient.on('error', () => { });
                        try {
                            await testClient.connect();
                            await testClient.ping();
                            await testClient.disconnect();
                            return {
                                store: await (0, cache_manager_redis_yet_1.redisStore)({
                                    url: redisUrl,
                                    ttl: 60 * 60 * 1000,
                                }),
                            };
                        }
                        catch (error) {
                            console.warn('⚠️ Redis connection unavailable, falling back to in-memory cache:', error?.message || error);
                        }
                    }
                    return {
                        ttl: 60 * 60 * 1000,
                    };
                },
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            companies_module_1.CompaniesModule,
            mail_module_1.MailModule,
            categories_module_1.CategoriesModule,
            service_types_module_1.ServiceTypesModule,
            services_module_1.ServicesModule,
            reviews_module_1.ReviewsModule,
            saved_items_module_1.SavedItemsModule,
            bookings_module_1.BookingsModule,
            payments_module_1.PaymentsModule,
            health_module_1.HealthModule,
            conversations_module_1.ConversationsModule,
            addresses_module_1.AddressesModule,
            audit_logs_module_1.AuditLogsModule,
            settings_module_1.SettingsModule,
            location_module_1.LocationModule,
            admin_module_1.AdminModule,
            disputes_module_1.DisputesModule,
            staff_module_1.StaffModule,
            payouts_module_1.PayoutsModule,
            search_module_1.SearchModule,
            notifications_module_1.NotificationsModule,
            upload_module_1.UploadModule,
            audit_module_1.AuditModule,
            wallets_module_1.WalletsModule,
            analytics_module_1.AnalyticsModule,
            financials_module_1.FinancialsModule,
            webhooks_module_1.WebhooksModule,
            promo_codes_module_1.PromoCodesModule,
            pricing_rules_module_1.PricingRulesModule,
            support_module_1.SupportModule,
            moderation_module_1.ModerationModule,
            compliance_module_1.ComplianceModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map