import { PrismaService } from '../prisma/prisma.service';
export declare class SettingsService {
    private prisma;
    constructor(prisma: PrismaService);
    getAllSettings(): Promise<Record<string, any>>;
    getSetting(keyName: string, defaultValue?: string): Promise<string>;
    getSettingNumber(keyName: string, defaultValue?: number): Promise<number>;
    updateSettings(dto: Record<string, any>): Promise<{
        message: string;
    }>;
}
