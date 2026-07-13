import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Expo, { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { MailService } from '../mail/mail.service';

@Injectable()
export class NotificationsService {
  private expo: Expo;

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {
    this.expo = new Expo();
  }

  /**
   * Save / update the push token for a user after they grant permission in-app.
   */
  async savePushToken(userId: bigint, pushToken: string): Promise<void> {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.warn(`Invalid Expo push token: ${pushToken}`);
      return;
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { pushToken },
    });
  }

  /**
   * Send a push notification to a single user by userId.
   */
  async sendToUser(
    userId: bigint,
    title: string,
    body: string,
    data: Record<string, any> = {},
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { pushToken: true, pushNotificationsEnabled: true },
    });

    if (
      !user?.pushNotificationsEnabled ||
      !user?.pushToken ||
      !Expo.isExpoPushToken(user.pushToken)
    ) {
      return; // User hasn't granted push permissions or disabled them
    }

    await this.sendMessages([
      {
        to: user.pushToken,
        sound: 'default',
        title,
        body,
        data,
      },
    ]);
  }

  /**
   * Send push notifications to multiple users.
   */
  async sendToUsers(
    userIds: bigint[],
    title: string,
    body: string,
    data: Record<string, any> = {},
  ): Promise<void> {
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { pushToken: true, pushNotificationsEnabled: true },
    });

    const messages: ExpoPushMessage[] = users
      .filter(
        (u) =>
          u.pushNotificationsEnabled &&
          u.pushToken &&
          Expo.isExpoPushToken(u.pushToken),
      )
      .map((u) => ({
        to: u.pushToken!,
        sound: 'default' as const,
        title,
        body,
        data,
      }));

    if (messages.length === 0) return;

    await this.sendMessages(messages);
  }

  /**
   * Store an in-app notification record in DB and (optionally) send push.
   */
  async createNotification(
    userId: bigint,
    type: string,
    title: string,
    message: string,
    data: any = {},
    sendPush = true,
  ): Promise<void> {
    // Store in DB (body = message, link = optional from data)
    await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body: message,
        isRead: false,
        link: data?.bookingId ? `/bookings/${data.bookingId}` : null,
      },
    });

    // Also push to device
    if (sendPush) {
      await this.sendToUser(userId, title, message, data).catch((err) => {
        console.error('Push notification failed (non-blocking):', err);
      });
    }
  }

  // ── Convenience wrappers for common events ────────────────────────────────

  async notifyBookingCreated(
    customerId: bigint,
    companyOwnerId: bigint,
    serviceName: string,
    bookingId: string,
  ) {
    await Promise.all([
      this.createNotification(
        customerId,
        'booking_confirmed',
        '✅ Booking Confirmed',
        `Your booking for "${serviceName}" has been received!`,
        { bookingId },
      ),
      this.createNotification(
        companyOwnerId,
        'new_booking',
        '🔔 New Booking',
        `You have a new booking request for "${serviceName}"`,
        { bookingId },
      ),
    ]);

    // Send Emails
    const [customer, owner] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: customerId },
        select: { email: true, fullName: true },
      }),
      this.prisma.user.findUnique({
        where: { id: companyOwnerId },
        select: { email: true, fullName: true },
      }),
    ]);

    if (customer?.email) {
      await this.mailService
        .sendBookingConfirmationEmail(
          customer.email,
          customer.fullName,
          serviceName,
          owner?.fullName || 'Company',
          new Date().toLocaleDateString(),
          new Date().toLocaleTimeString(),
        )
        .catch(console.error);
    }
    if (owner?.email) {
      await this.mailService
        .sendNewBookingEmail(
          owner.email,
          owner.fullName,
          serviceName,
          new Date().toLocaleDateString(),
          new Date().toLocaleTimeString(),
        )
        .catch(console.error);
    }
  }

  async notifyBookingStatusChanged(
    customerId: bigint,
    status: string,
    serviceName: string,
    bookingId: string,
  ) {
    const statusMessages: Record<string, { title: string; body: string }> = {
      confirmed: {
        title: '✅ Booking Confirmed',
        body: `"${serviceName}" has been confirmed.`,
      },
      in_progress: {
        title: '🔧 Work Started',
        body: `Your "${serviceName}" service has started.`,
      },
      completed: {
        title: '🎉 Service Completed',
        body: `"${serviceName}" is done! Please leave a review.`,
      },
      cancelled: {
        title: '❌ Booking Cancelled',
        body: `Your booking for "${serviceName}" was cancelled.`,
      },
    };

    const msg = statusMessages[status];
    if (!msg) return;

    await this.createNotification(
      customerId,
      `booking_${status}`,
      msg.title,
      msg.body,
      { bookingId },
    );

    const customer = await this.prisma.user.findUnique({
      where: { id: customerId },
      select: { email: true, fullName: true },
    });
    if (customer?.email) {
      await this.mailService
        .sendBookingStatusChangedEmail(
          customer.email,
          customer.fullName,
          serviceName,
          status,
        )
        .catch(console.error);
    }
  }

  async notifyPayoutProcessed(companyOwnerId: bigint, amount: number) {
    await this.createNotification(
      companyOwnerId,
      'payout_processed',
      '💰 Payout Processed',
      `Your payout of $${amount.toFixed(2)} has been processed.`,
      { amount },
    );

    const owner = await this.prisma.user.findUnique({
      where: { id: companyOwnerId },
      select: { email: true, fullName: true },
    });
    if (owner?.email) {
      await this.mailService
        .sendPayoutProcessedEmail(owner.email, owner.fullName, amount)
        .catch(console.error);
    }
  }

  async notifyCompanyVerified(
    companyOwnerId: bigint,
    companyName: string,
    approved: boolean,
  ) {
    const title = approved
      ? '✅ Company Verified!'
      : '❌ Verification Rejected';
    const message = approved
      ? `"${companyName}" has been approved! You can now accept bookings.`
      : `"${companyName}" verification was rejected. Please update your details and resubmit.`;

    await this.createNotification(
      companyOwnerId,
      approved ? 'company_verified' : 'company_rejected',
      title,
      message,
      { companyName },
    );

    const owner = await this.prisma.user.findUnique({
      where: { id: companyOwnerId },
      select: { email: true, fullName: true },
    });
    if (owner?.email) {
      await this.mailService
        .sendCompanyVerifiedEmail(owner.email, owner.fullName, approved)
        .catch(console.error);
    }
  }

  // ── DB query helpers ─────────────────────────────────────────────────────

  async getNotificationsForUser(userId: bigint) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return notifications.map((n) => ({
      id: n.id.toString(),
      userId: n.userId.toString(),
      title: n.title,
      body: n.body,
      type: n.type,
      isRead: n.isRead,
      link: n.link,
      createdAt: n.createdAt,
    }));
  }

  async markAsRead(notificationId: bigint, userId: bigint) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
    return { success: true };
  }

  async markAllAsRead(userId: bigint) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: bigint): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  // ── Internal send helper ──────────────────────────────────────────────────

  private async sendMessages(messages: ExpoPushMessage[]): Promise<void> {
    const chunks = this.expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        const tickets: ExpoPushTicket[] =
          await this.expo.sendPushNotificationsAsync(chunk);
        for (const ticket of tickets) {
          if (ticket.status === 'error') {
            console.error('Push error:', ticket.message, ticket.details);
          }
        }
      } catch (error) {
        console.error('Failed to send push chunk:', error);
      }
    }
  }
}
