import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MfaService {
  constructor(private configService: ConfigService) {}

  /**
   * Generate a TOTP secret and QR code URL for a user
   */
  async generateMfaSecret(email: string) {
    const secret = authenticator.generateSecret();
    const appName = this.configService.get('APP_NAME') || 'ServiceFinder';

    // The uri generated here is what authenticator apps use to add the account
    const otpauthUrl = authenticator.keyuri(email, appName, secret);
    const qrCodeUrl = await qrcode.toDataURL(otpauthUrl);

    return {
      secret,
      qrCodeUrl,
    };
  }

  /**
   * Verify a TOTP token against a secret
   */
  isMfaTokenValid(token: string, secret: string): boolean {
    authenticator.options = { window: 1 };
    return authenticator.verify({ token, secret });
  }
}
