import { PrismaService } from '../prisma/prisma.service';
export declare class WebhooksService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handleKhqrPayment(payload: any): Promise<{
        received: boolean;
        status: string;
    }>;
}
