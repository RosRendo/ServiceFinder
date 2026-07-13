import { PrismaService } from './prisma/prisma.service';
export declare class AppService {
    private prisma;
    constructor(prisma: PrismaService);
    getHello(): string;
    getLiveStats(): Promise<{
        stats: {
            label: string;
            value: string;
        }[];
        tickerItems: string[];
    }>;
}
