import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class AnalyticsService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private posthog;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    onModuleDestroy(): Promise<void>;
    captureEvent(distinctId: string, event: string, properties?: Record<string, any>): void;
}
