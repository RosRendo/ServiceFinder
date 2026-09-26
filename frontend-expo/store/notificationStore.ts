import { create } from 'zustand';
import { api } from './authStore';

export type NotificationType =
  | 'new_booking'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'payment_received'
  | 'new_message'
  | 'job_assigned'
  | 'job_completed'
  | 'dispute_update'
  | 'payout_processed'
  | 'company_verified'
  | 'review_received'
  | 'support_reply'
  | string;

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
  link?: string | null;
}

interface NotificationStore {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  connected: boolean;

  // Actions
  fetchNotifications: () => Promise<void>;
  addNotification: (n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => void;
  setConnected: (connected: boolean) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  connected: false,

  fetchNotifications: async () => {
    try {
      set({ loading: true });
      const res = await api.get('/api/notifications');
      const raw = res.data?.data ?? res.data ?? [];
      const list = Array.isArray(raw) ? raw : [];
      const mapped: AppNotification[] = list.map((item: any) => ({
        id: String(item.id),
        type: item.type || 'system',
        title: item.title || 'Notification',
        body: item.body || item.message || '',
        read: Boolean(item.isRead ?? item.read),
        createdAt: new Date(item.createdAt),
        link: item.link,
        data: item.data,
      }));
      set({
        notifications: mapped,
        unreadCount: mapped.filter((n) => !n.read).length,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  addNotification: (n) => {
    const notification: AppNotification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      read: false,
      createdAt: new Date(),
      ...n,
    };
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 100),
      unreadCount: state.unreadCount + 1,
    }));
  },

  markRead: async (id: string) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    });
    try {
      await api.patch(`/api/notifications/${id}/read`);
    } catch {
      // non-blocking
    }
  },

  markAllRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
    try {
      await api.patch('/api/notifications/read-all');
    } catch {
      // non-blocking
    }
  },

  deleteNotification: async (id: string) => {
    set((state) => {
      const updated = state.notifications.filter((n) => n.id !== id);
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    });
    try {
      await api.delete(`/api/notifications/${id}`);
    } catch {
      // non-blocking
    }
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },

  setConnected: (connected) => set({ connected }),
}));
