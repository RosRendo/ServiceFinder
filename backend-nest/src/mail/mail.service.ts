import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(MailService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  @OnEvent('settings.updated')
  handleSettingsUpdated(payload: any) {
    this.logger.log('Settings updated, clearing email transporter cache');
    this.transporter = null;
  }

  private async getTransporter() {
    if (this.transporter) return this.transporter;

    // Fetch SMTP settings from DB (SystemSetting)
    const settings = await this.prisma.systemSetting.findMany({
      where: {
        keyName: {
          in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass'],
        },
      },
    });

    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.keyName] = curr.value;
      return acc;
    }, {} as Record<string, string | null>);

    // Fallback to ConfigService if not found in DB
    const smtpHost = settingsMap['smtp_host'] || this.configService.get<string>('SMTP_HOST');
    const smtpUser = settingsMap['smtp_user'] || this.configService.get<string>('SMTP_USER');
    const smtpPass = settingsMap['smtp_pass'] || this.configService.get<string>('SMTP_PASS');

    if (smtpHost) {
      const port = parseInt(
        settingsMap['smtp_port'] || this.configService.get<string>('SMTP_PORT') || '465',
        10,
      );
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    } else {
      // Fallback to old Gmail logic if no host is specified
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }

    return this.transporter;
  }

  private renderTemplate(templateString: string, variables: Record<string, string>): string {
    let result = templateString;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }

  private async fetchAndSendTemplate(
    templateId: string,
    to: string,
    variables: Record<string, string>,
    fallbackTemplate?: { subject: string; html: string; text: string },
  ) {
    try {
      const dbTemplate = await (this.prisma as any).emailTemplate.findUnique({
        where: { templateId },
      });

      let subject = '';
      let html = '';
      let text = '';

      if (dbTemplate && dbTemplate.status === 'active') {
        subject = this.renderTemplate(dbTemplate.subject, variables);
        html = this.renderTemplate(dbTemplate.body, variables);
        // Basic fallback for text if DB doesn't have a separate text field
        text = html.replace(/<[^>]+>/g, ''); 
      } else if (fallbackTemplate) {
        subject = fallbackTemplate.subject;
        html = fallbackTemplate.html;
        text = fallbackTemplate.text;
      } else {
        this.logger.warn(`Template ${templateId} not found and no fallback provided.`);
        return;
      }

      await this.sendMail(to, subject, text, html);
    } catch (error) {
      this.logger.error(`Failed to send template ${templateId}`, error);
    }
  }

  async sendPasswordResetEmail(to: string, code: string, userName: string) {
    const fallback = this.getPasswordResetTemplate(code, userName);
    await this.fetchAndSendTemplate(
      'password_reset',
      to,
      { user_name: userName, reset_url: code, expiry_time: '15 minutes' },
      fallback,
    );
  }

  async sendStaffWelcomeEmail(
    to: string,
    tempPassword: string,
    companyName: string,
    userName: string,
  ) {
    const loginUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const fallback = this.getStaffWelcomeTemplate(
      userName,
      companyName,
      tempPassword,
      loginUrl,
    );
    await this.fetchAndSendTemplate(
      'staff_welcome',
      to,
      { user_name: userName, company_name: companyName, temp_password: tempPassword, login_url: loginUrl },
      fallback,
    );
  }

  async sendBookingConfirmationEmail(
    to: string,
    customerName: string,
    serviceName: string,
    companyName: string,
    date: string,
    time: string,
  ) {
    const fallback = this.getBookingConfirmationTemplate(
      customerName,
      serviceName,
      companyName,
      date,
      time,
    );
    await this.fetchAndSendTemplate(
      'booking_confirmation',
      to,
      { customer_name: customerName, service_name: serviceName, company_name: companyName, date, time },
      fallback,
    );
  }

  async sendNewBookingEmail(
    to: string,
    companyName: string,
    serviceName: string,
    date: string,
    time: string,
  ) {
    const year = new Date().getFullYear();
    const subject = `New Booking Request for ${serviceName}`;
    const text = `Hi ${companyName},\n\nYou have a new booking request for ${serviceName} on ${date} at ${time}.\nPlease log in to your dashboard to review.\n\n© ${year} Service Finder. All rights reserved.`;
    const html = `<div style="font-family: sans-serif; padding: 20px;"><h2>New Booking Request</h2><p>Hi ${companyName},</p><p>You have a new booking request for <strong>${serviceName}</strong> on ${date} at ${time}.</p><p>Please log in to your dashboard to review and confirm.</p></div>`;
    
    await this.fetchAndSendTemplate(
      'new_booking',
      to,
      { company_name: companyName, service_name: serviceName, date, time },
      { subject, html, text },
    );
  }

  async sendBookingStatusChangedEmail(
    to: string,
    customerName: string,
    serviceName: string,
    status: string,
  ) {
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
    
    await this.fetchAndSendTemplate(
      'booking_status_changed',
      to,
      { customer_name: customerName, service_name: serviceName, status_text: statusText },
      { subject, html, text },
    );
  }

  async sendCompanyVerifiedEmail(
    to: string,
    companyName: string,
    approved: boolean,
  ) {
    const year = new Date().getFullYear();
    const subject = approved
      ? `✅ Company Verified: ${companyName}`
      : `❌ Verification Rejected: ${companyName}`;
    const text = approved
      ? `Hi ${companyName},\n\nGood news! Your company verification has been approved. You can now start accepting bookings on Service Finder.\n\n© ${year} Service Finder.`
      : `Hi ${companyName},\n\nUnfortunately, your company verification was rejected. Please log in to your dashboard to update your details and resubmit.\n\n© ${year} Service Finder.`;
    const html = `<div style="font-family: sans-serif; padding: 20px;"><h2>${approved ? 'Company Verified!' : 'Verification Update'}</h2><p>${text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p></div>`;
    
    await this.fetchAndSendTemplate(
      approved ? 'company_verified' : 'company_rejected',
      to,
      { company_name: companyName },
      { subject, html, text },
    );
  }

  async sendPayoutProcessedEmail(
    to: string,
    companyName: string,
    amount: number,
  ) {
    const year = new Date().getFullYear();
    const subject = `💰 Payout Processed`;
    const text = `Hi ${companyName},\n\nYour payout of $${amount.toFixed(2)} has been successfully processed.\n\n© ${year} Service Finder.`;
    const html = `<div style="font-family: sans-serif; padding: 20px;"><h2>Payout Processed</h2><p>Hi ${companyName},</p><p>Your payout of <strong>$${amount.toFixed(2)}</strong> has been successfully processed.</p></div>`;
    
    await this.fetchAndSendTemplate(
      'payout_processed',
      to,
      { company_name: companyName, amount: amount.toFixed(2) },
      { subject, html, text },
    );
  }

  async sendMail(
    to: string,
    subject: string,
    text: string,
    html: string,
  ) {
    try {
      const transporter = await this.getTransporter();
      
      const settings = await this.prisma.systemSetting.findUnique({
        where: { keyName: 'smtp_from_email' }
      });
      const fromEmail = settings?.value || this.configService.get<string>('SMTP_FROM_EMAIL') || this.configService.get<string>('SMTP_USER');
      
      await transporter.sendMail({
        from: '"Service Finder" <' + fromEmail + '>',
        to,
        subject,
        text,
        html,
      });
    } catch (error) {
      this.logger.error('Error sending email:', error);
      throw error;
    }
  }

  private getPasswordResetTemplate(code: string, userName: string) {
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

  private getStaffWelcomeTemplate(
    userName: string,
    companyName: string,
    tempPassword: string,
    loginUrl: string,
  ) {
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

  private getBookingConfirmationTemplate(
    customerName: string,
    serviceName: string,
    companyName: string,
    date: string,
    time: string,
  ) {
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
}
