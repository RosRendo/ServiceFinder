import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async getAllSettings() {
    const settings = await this.prisma.systemSetting.findMany();
    // Convert array of objects to key-value pairs
    const config: Record<string, any> = {};
    settings.forEach((setting) => {
      try {
        config[setting.keyName] = JSON.parse(setting.value || 'null');
      } catch {
        config[setting.keyName] = setting.value;
      }
    });
    return config;
  }

  async getSetting(
    keyName: string,
    defaultValue: string = '',
  ): Promise<string> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { keyName },
    });
    return setting?.value || defaultValue;
  }

  async getSettingNumber(
    keyName: string,
    defaultValue: number = 0,
  ): Promise<number> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { keyName },
    });
    if (setting && setting.value) {
      const parsed = Number(setting.value);
      if (!isNaN(parsed)) return parsed;
    }
    return defaultValue;
  }

  async updateSettings(dto: Record<string, any>) {
    const updates = Object.entries(dto).map(async ([key, value]) => {
      const stringValue =
        typeof value === 'object' ? JSON.stringify(value) : String(value);
      return this.prisma.systemSetting.upsert({
        where: { keyName: key },
        update: { value: stringValue },
        create: { keyName: key, value: stringValue },
      });
    });

    await Promise.all(updates);
    
    this.eventEmitter.emit('settings.updated', dto);

    return { message: 'Settings updated successfully' };
  }
}
