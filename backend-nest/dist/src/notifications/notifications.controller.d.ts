import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private notificationsService;
    constructor(notificationsService: NotificationsService);
    savePushToken(req: any, body: {
        pushToken: string;
    }): Promise<{
        message: string;
    }>;
    getMyNotifications(req: any): Promise<{
        id: string;
        userId: string;
        title: string;
        body: string;
        type: string;
        isRead: boolean;
        link: string | null;
        createdAt: Date;
    }[]>;
    markAsRead(req: any, id: string): Promise<{
        success: boolean;
    }>;
    deleteNotification(req: any, id: string): Promise<{
        success: boolean;
    }>;
    markAllAsRead(req: any): Promise<{
        message: string;
    }>;
    getUnreadCount(req: any): Promise<{
        count: number;
    }>;
}
