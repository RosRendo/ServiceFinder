"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = __importStar(require("nodemailer"));
const config_1 = require("@nestjs/config");
let MailService = class MailService {
    configService;
    transporter;
    constructor(configService) {
        this.configService = configService;
        const smtpHost = this.configService.get('SMTP_HOST');
        if (smtpHost) {
            const port = parseInt(this.configService.get('SMTP_PORT') || '465', 10);
            this.transporter = nodemailer.createTransport({
                host: smtpHost,
                port: port,
                secure: port === 465,
                auth: {
                    user: this.configService.get('SMTP_USER'),
                    pass: this.configService.get('SMTP_PASS'),
                },
            });
        }
        else {
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: this.configService.get('SMTP_USER'),
                    pass: this.configService.get('SMTP_PASS'),
                },
            });
        }
    }
    async sendPasswordResetEmail(to, code, userName) {
        const template = this.getPasswordResetTemplate(code, userName);
        await this.sendMail(to, template.subject, template.text, template.html);
    }
    async sendStaffWelcomeEmail(to, tempPassword, companyName, userName) {
        const loginUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
        const template = this.getStaffWelcomeTemplate(userName, companyName, tempPassword, loginUrl);
        await this.sendMail(to, template.subject, template.text, template.html);
    }
    async sendBookingConfirmationEmail(to, customerName, serviceName, companyName, date, time) {
        const template = this.getBookingConfirmationTemplate(customerName, serviceName, companyName, date, time);
        await this.sendMail(to, template.subject, template.text, template.html);
    }
    async sendNewBookingEmail(to, companyName, serviceName, date, time) {
        const year = new Date().getFullYear();
        const subject = `New Booking Request for ${serviceName}`;
        const text = `Hi ${companyName},\n\nYou have a new booking request for ${serviceName} on ${date} at ${time}.\nPlease log in to your dashboard to review.\n\n© ${year} Service Finder. All rights reserved.`;
        const html = `<div style="font-family: sans-serif; padding: 20px;"><h2>New Booking Request</h2><p>Hi ${companyName},</p><p>You have a new booking request for <strong>${serviceName}</strong> on ${date} at ${time}.</p><p>Please log in to your dashboard to review and confirm.</p></div>`;
        await this.sendMail(to, subject, text, html);
    }
    async sendBookingStatusChangedEmail(to, customerName, serviceName, status) {
        const year = new Date().getFullYear();
        let statusText = '';
        switch (status) {
            case 'in_progress':
                statusText = 'is now in progress';
                break;
            case 'completed':
                statusText = 'has been completed';
                break;
            case 'cancelled':
                statusText = 'has been cancelled';
                break;
            default:
                statusText = `status changed to ${status}`;
        }
        const subject = `Booking Update: ${serviceName}`;
        const text = `Hi ${customerName},\n\nYour booking for ${serviceName} ${statusText}.\n\n© ${year} Service Finder.`;
        const html = `<div style="font-family: sans-serif; padding: 20px;"><h2>Booking Update</h2><p>Hi ${customerName},</p><p>Your booking for <strong>${serviceName}</strong> ${statusText}.</p></div>`;
        await this.sendMail(to, subject, text, html);
    }
    async sendCompanyVerifiedEmail(to, companyName, approved) {
        const year = new Date().getFullYear();
        const subject = approved
            ? `✅ Company Verified: ${companyName}`
            : `❌ Verification Rejected: ${companyName}`;
        const text = approved
            ? `Hi ${companyName},\n\nGood news! Your company verification has been approved. You can now start accepting bookings on Service Finder.\n\n© ${year} Service Finder.`
            : `Hi ${companyName},\n\nUnfortunately, your company verification was rejected. Please log in to your dashboard to update your details and resubmit.\n\n© ${year} Service Finder.`;
        const html = `<div style="font-family: sans-serif; padding: 20px;"><h2>${approved ? 'Company Verified!' : 'Verification Update'}</h2><p>${text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p></div>`;
        await this.sendMail(to, subject, text, html);
    }
    async sendPayoutProcessedEmail(to, companyName, amount) {
        const year = new Date().getFullYear();
        const subject = `💰 Payout Processed`;
        const text = `Hi ${companyName},\n\nYour payout of $${amount.toFixed(2)} has been successfully processed.\n\n© ${year} Service Finder.`;
        const html = `<div style="font-family: sans-serif; padding: 20px;"><h2>Payout Processed</h2><p>Hi ${companyName},</p><p>Your payout of <strong>$${amount.toFixed(2)}</strong> has been successfully processed.</p></div>`;
        await this.sendMail(to, subject, text, html);
    }
    async sendMail(to, subject, text, html) {
        try {
            const fromEmail = this.configService.get('SMTP_FROM_EMAIL') ||
                this.configService.get('SMTP_USER');
            await this.transporter.sendMail({
                from: '"Service Finder" <' + fromEmail + '>',
                to,
                subject,
                text,
                html,
            });
        }
        catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }
    getPasswordResetTemplate(code, userName) {
        const year = new Date().getFullYear();
        const html = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F8FC; padding: 40px 20px; color: #111827;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #EAECF5;">
        <div style="background-color: #0A192F; padding: 32px; text-align: center;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Service Finder</h1>
        </div>
        <div style="padding: 40px 32px;">
          <h2 style="margin-top: 0; font-size: 20px; font-weight: 700; color: #111827;">Reset Your Password / កំណត់ពាក្យសម្ងាត់របស់អ្នកឡើងវិញ</h2>
          <p style="font-size: 16px; line-height: 24px; color: #4B5563; margin-bottom: 24px;">Hi / សួស្តី ${userName},</p>
          <p style="font-size: 16px; line-height: 24px; color: #4B5563; margin-bottom: 12px;">We received a request to reset your password. Use the verification code below to securely change your password.</p>
          <p style="font-size: 16px; line-height: 24px; color: #4B5563; margin-bottom: 32px; font-family: 'Khmer OS', sans-serif;">យើងទទួលបានសំណើរសុំកំណត់ពាក្យសម្ងាត់របស់អ្នកឡើងវិញ។ សូមប្រើលេខកូដបញ្ជាក់ខាងក្រោមដើម្បីផ្លាស់ប្តូរពាក្យសម្ងាត់របស់អ្នកដោយសុវត្ថិភាព។</p>
          
          <div style="background-color: #F0F4F8; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px; border: 1px dashed #9CA3AF;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0A192F;">${code}</span>
          </div>
          
          <p style="font-size: 14px; line-height: 20px; color: #6B7280; margin-bottom: 8px;">If you didn't request this, you can safely ignore this email. Your password will remain unchanged.</p>
          <p style="font-size: 14px; line-height: 20px; color: #6B7280; margin-bottom: 0; font-family: 'Khmer OS', sans-serif;">ប្រសិនបើអ្នកមិនបានស្នើសុំនេះទេ អ្នកអាចមិនអើពើនឹងអ៊ីមែលនេះបាន។ ពាក្យសម្ងាត់របស់អ្នកនឹងនៅដដែល។</p>
        </div>
        <div style="background-color: #F9FAFB; padding: 24px 32px; border-top: 1px solid #EAECF5; text-align: center;">
          <p style="font-size: 12px; color: #9CA3AF; margin: 0;">&copy; ${year} Service Finder. All rights reserved.</p>
        </div>
      </div>
    </div>`;
        return {
            subject: 'Your Password Reset Code - Service Finder',
            html,
            text: `Hi / សួស្តី ${userName},\n\nWe received a request to reset your password. / យើងទទួលបានសំណើរសុំកំណត់ពាក្យសម្ងាត់របស់អ្នកឡើងវិញ។\n\nYour verification code is / លេខកូដបញ្ជាក់របស់អ្នកគឺ: ${code}\n\nIf you didn't request this, you can safely ignore this email.\n\n© ${year} Service Finder. All rights reserved.`,
        };
    }
    getStaffWelcomeTemplate(userName, companyName, tempPassword, loginUrl) {
        const year = new Date().getFullYear();
        const html = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F8FC; padding: 40px 20px; color: #111827;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #EAECF5;">
        <div style="background-color: #0A192F; padding: 32px; text-align: center;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">${companyName}</h1>
        </div>
        <div style="padding: 40px 32px;">
          <h2 style="margin-top: 0; font-size: 20px; font-weight: 700; color: #111827;">Welcome to the Team!</h2>
          <p style="font-size: 16px; line-height: 24px; color: #4B5563; margin-bottom: 24px;">Hi ${userName},</p>
          <p style="font-size: 16px; line-height: 24px; color: #4B5563; margin-bottom: 32px;">Your staff account has been successfully created. Below are your temporary login credentials. Please log in and change your password immediately.</p>
          
          <div style="background-color: #F0F4F8; border-radius: 12px; padding: 24px; margin-bottom: 32px; border: 1px solid #E2E8F0;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748B; font-weight: 600; text-transform: uppercase;">Temporary Password</p>
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: #0F172A; letter-spacing: 1px;">${tempPassword}</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${loginUrl}" style="display: inline-block; background-color: #0A192F; color: #FFFFFF; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Access Staff Portal</a>
          </div>
        </div>
        <div style="background-color: #F9FAFB; padding: 24px 32px; border-top: 1px solid #EAECF5; text-align: center;">
          <p style="font-size: 12px; color: #9CA3AF; margin: 0;">&copy; ${year} ${companyName}. Powered by Service Finder.</p>
        </div>
      </div>
    </div>`;
        return {
            subject: `Welcome to ${companyName} - Your Account is Ready`,
            html,
            text: `Hi ${userName},\n\nWelcome to ${companyName}. Your staff account is ready.\n\nTemporary Password: ${tempPassword}\n\nLogin here: ${loginUrl}\n\n© ${year} ${companyName}. All rights reserved.`,
        };
    }
    getBookingConfirmationTemplate(customerName, serviceName, companyName, date, time) {
        const year = new Date().getFullYear();
        const html = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F8FC; padding: 40px 20px; color: #111827;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #EAECF5;">
        <div style="background-color: #0A192F; padding: 32px; text-align: center;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Booking Confirmed / ការកក់ត្រូវបានបញ្ជាក់</h1>
        </div>
        <div style="padding: 40px 32px;">
          <p style="font-size: 16px; line-height: 24px; color: #4B5563; margin-top: 0; margin-bottom: 24px;">Hi / សួស្តី ${customerName},</p>
          <p style="font-size: 16px; line-height: 24px; color: #4B5563; margin-bottom: 12px;">Your appointment is officially confirmed! Here are the details of your upcoming booking:</p>
          <p style="font-size: 16px; line-height: 24px; color: #4B5563; margin-bottom: 32px; font-family: 'Khmer OS', sans-serif;">ការណាត់ជួបរបស់អ្នកត្រូវបានបញ្ជាក់ជាផ្លូវការ! ខាងក្រោមនេះគឺជាព័ត៌មានលម្អិតនៃការកក់របស់អ្នក៖</p>
          
          <div style="background-color: #F8FAFC; border-radius: 12px; padding: 24px; border: 1px solid #E2E8F0; margin-bottom: 32px;">
            <div style="margin-bottom: 16px;">
              <p style="margin: 0; font-size: 13px; color: #64748B; font-weight: 600; text-transform: uppercase;">Service / សេវាកម្ម</p>
              <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #0F172A;">${serviceName}</p>
            </div>
            <div style="margin-bottom: 16px;">
              <p style="margin: 0; font-size: 13px; color: #64748B; font-weight: 600; text-transform: uppercase;">Provider / អ្នកផ្តល់សេវាកម្ម</p>
              <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #0F172A;">${companyName}</p>
            </div>
            <div style="display: flex; gap: 24px;">
              <div style="flex: 1;">
                <p style="margin: 0; font-size: 13px; color: #64748B; font-weight: 600; text-transform: uppercase;">Date / កាលបរិច្ឆេទ</p>
                <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #0F172A;">${date}</p>
              </div>
              <div style="flex: 1;">
                <p style="margin: 0; font-size: 13px; color: #64748B; font-weight: 600; text-transform: uppercase;">Time / ម៉ោង</p>
                <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #0F172A;">${time}</p>
              </div>
            </div>
          </div>
          
          <p style="font-size: 14px; line-height: 20px; color: #6B7280; margin-bottom: 0;">If you need to make changes to your booking, please log into your account or contact the provider directly.</p>
        </div>
        <div style="background-color: #F9FAFB; padding: 24px 32px; border-top: 1px solid #EAECF5; text-align: center;">
          <p style="font-size: 12px; color: #9CA3AF; margin: 0;">&copy; ${year} Service Finder. All rights reserved.</p>
        </div>
      </div>
    </div>`;
        return {
            subject: `Booking Confirmed: ${serviceName} (${date})`,
            html,
            text: `Hi / សួស្តី ${customerName},\n\nYour booking is confirmed: / ការកក់របស់អ្នកត្រូវបានបញ្ជាក់៖\n\nService / សេវាកម្ម: ${serviceName}\nProvider / អ្នកផ្តល់សេវាកម្ម: ${companyName}\nDate / កាលបរិច្ឆេទ: ${date}\nTime / ម៉ោង: ${time}\n\n© ${year} Service Finder. All rights reserved.`,
        };
    }
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map