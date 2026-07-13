import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PostHog } from 'posthog-node';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AnalyticsService implements OnModuleInit, OnModuleDestroy {
  private posthog: PostHog | null = null;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('POSTHOG_API_KEY');
    const host =
      this.configService.get<string>('POSTHOG_HOST') ||
      'https://us.i.posthog.com';

    if (apiKey) {
      this.posthog = new PostHog(apiKey, { host });
    }
  }

  async onModuleDestroy() {
    if (this.posthog) {
      await this.posthog.shutdown();
    }
  }

  captureEvent(
    distinctId: string,
    event: string,
    properties?: Record<string, any>,
  ) {
    if (this.posthog) {
      this.posthog.capture({
        distinctId,
        event,
        properties,
      });
    }
  }
}
