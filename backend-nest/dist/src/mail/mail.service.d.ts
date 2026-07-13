import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private configService;
    private transporter;
    constructor(configService: ConfigService);
    sendPasswordResetEmail(to: string, code: string, userName: string): Promise<void>;
    sendStaffWelcomeEmail(to: string, tempPassword: string, companyName: string, userName: string): Promise<void>;
    sendBookingConfirmationEmail(to: string, customerName: string, serviceName: string, companyName: string, date: string, time: string): Promise<void>;
    sendNewBookingEmail(to: string, companyName: string, serviceName: string, date: string, time: string): Promise<void>;
    sendBookingStatusChangedEmail(to: string, customerName: string, serviceName: string, status: string): Promise<void>;
    sendCompanyVerifiedEmail(to: string, companyName: string, approved: boolean): Promise<void>;
    sendPayoutProcessedEmail(to: string, companyName: string, amount: number): Promise<void>;
    private sendMail;
    private getPasswordResetTemplate;
    private getStaffWelcomeTemplate;
    private getBookingConfirmationTemplate;
}
