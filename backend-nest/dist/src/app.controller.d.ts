import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): string;
    getLiveStats(): Promise<{
        stats: {
            label: string;
            value: string;
        }[];
        tickerItems: string[];
    }>;
}
