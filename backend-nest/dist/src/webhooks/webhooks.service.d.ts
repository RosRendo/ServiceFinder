import { PrismaService } from '../prisma/prisma.service';
export declare class WebhooksService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    verifyAbaSignature(tran_id: string, status: string, hash: string): void;
    handleAbaPayment(payload: any): Promise<{
        received: boolean;
        status: string;
    }>;
}
