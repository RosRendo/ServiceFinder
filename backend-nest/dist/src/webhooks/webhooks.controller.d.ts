import { WebhooksService } from './webhooks.service';
export declare class WebhooksController {
    private readonly webhooksService;
    constructor(webhooksService: WebhooksService);
    handleKhqrPayment(payload: any): Promise<{
        received: boolean;
        status: string;
    }>;
}
