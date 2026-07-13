import { ConfigService } from '@nestjs/config';
export declare class MfaService {
    private configService;
    constructor(configService: ConfigService);
    generateMfaSecret(email: string): Promise<{
        secret: string;
        qrCodeUrl: string;
    }>;
    isMfaTokenValid(token: string, secret: string): boolean;
}
