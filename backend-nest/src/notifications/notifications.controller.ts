import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  /**
   * POST /api/notifications/push-token
   * Mobile app calls this after requesting push permissions.
   */
  @Post('push-token')
  @HttpCode(HttpStatus.OK)
  async savePushToken(@Req() req: any, @Body() body: { pushToken: string }) {
    const userId = BigInt(req.user.userId);
    await this.notificationsService.savePushToken(userId, body.pushToken);
    return { message: 'Push token saved successfully' };
  }

  /**
   * GET /api/notifications
   * Returns all in-app notifications for the current user.
   */
  @Get()
  async getMyNotifications(@Req() req: any) {
    const userId = BigInt(req.user.userId);
    return this.notificationsService.getNotificationsForUser(userId);
  }

  /**
   * PATCH /api/notifications/:id/read
   * Mark a single notification as read.
   */
  @Patch(':id/read')
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    const userId = BigInt(req.user.userId);
    return this.notificationsService.markAsRead(BigInt(id), userId);
  }

  /**
   * PATCH /api/notifications/read-all
   * Mark all notifications as read.
   */
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Req() req: any) {
    const userId = BigInt(req.user.userId);
    await this.notificationsService.markAllAsRead(userId);
    return { message: 'All notifications marked as read' };
  }

  /**
   * GET /api/notifications/unread-count
   */
  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    const userId = BigInt(req.user.userId);
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }
}
