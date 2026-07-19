import { WebhooksService } from './webhooks.service';
export declare class WebhooksController {
    private readonly webhooksService;
    constructor(webhooksService: WebhooksService);
    handleAbaWebhook(payload: any): Promise<{
        received: boolean;
        status: string;
    }>;
    handleKhqrAlias(payload: any): Promise<{
        received: boolean;
        status: string;
    }>;
}
