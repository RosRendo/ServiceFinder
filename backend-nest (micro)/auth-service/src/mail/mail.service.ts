// @ts-nocheck
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_APP_PASSWORD'),
      },
    });
  }

  async sendPasswordResetEmail(to: string, code: string, userName: string) {
    const template = this.getPasswordResetTemplate(code, userName);
    await this.sendMail(to, template.subject, template.text, template.html);
  }

  async sendStaffWelcomeEmail(to: string, tempPassword: string, companyName: string, userName: string) {
    const loginUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const template = this.getStaffWelcomeTemplate(userName, companyName, tempPassword, loginUrl);
    await this.sendMail(to, template.subject, template.text, template.html);
  }

  async sendBookingConfirmationEmail(to: string, customerName: string, serviceName: string, companyName: string, date: string, time: string) {
    const template = this.getBookingConfirmationTemplate(customerName, serviceName, companyName, date, time);
    await this.sendMail(to, template.subject, template.text, template.html);
  }

  private async sendMail(to: string, subject: string, text: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: '"CleanService" <' + this.configService.get<string>('EMAIL_USER') + '>',
        to,
        subject,
        text,
        html,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  private getPasswordResetTemplate(code: string, userName: string) {
    const year = new Date().getFullYear();
    return {
      subject: 'Password Reset Code - CleanService',
      html: '<p>Hi ' + userName + ',</p><p>Your code is: <strong>' + code + '</strong></p>',
      text: 'Hi ' + userName + ',\\nYour code is: ' + code
    };
  }

  private getStaffWelcomeTemplate(userName: string, companyName: string, tempPassword: string, loginUrl: string) {
    const year = new Date().getFullYear();
    return {
      subject: 'Welcome to ' + companyName + ' - Your Account is Ready!',
      html: '<p>Hi ' + userName + ',</p><p>Welcome to ' + companyName + '. Your temporary password is: <strong>' + tempPassword + '</strong></p><p>Login here: ' + loginUrl + '</p>',
      text: 'Hi ' + userName + ',\\nWelcome to ' + companyName + '. Your temporary password is: ' + tempPassword
    };
  }

  private getBookingConfirmationTemplate(customerName: string, serviceName: string, companyName: string, date: string, time: string) {
    const year = new Date().getFullYear();
    return {
      subject: 'Booking Confirmed: ' + serviceName + ' with ' + companyName,
      html: '<p>Hi ' + customerName + ',</p><p>Your booking with ' + companyName + ' for ' + serviceName + ' on ' + date + ' at ' + time + ' is confirmed.</p>',
      text: 'Hi ' + customerName + ',\\nYour booking is confirmed.'
    };
  }
}

