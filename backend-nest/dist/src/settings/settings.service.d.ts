import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class SettingsService {
    private prisma;
    private eventEmitter;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
    getAllSettings(): Promise<Record<string, any>>;
    getSetting(keyName: string, defaultValue?: string): Promise<string>;
    getSettingNumber(keyName: string, defaultValue?: number): Promise<number>;
    updateSettings(dto: Record<string, any>): Promise<{
        message: string;
    }>;
}
