import { SettingsService } from './settings.service';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getAllSettings(): Promise<Record<string, any>>;
    updateSettings(dto: Record<string, any>): Promise<{
        message: string;
    }>;
}
