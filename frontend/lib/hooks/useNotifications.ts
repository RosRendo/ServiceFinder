import { useState, useEffect } from 'react';
import { useSocket } from './useSocket';
import { useAuthContext } from '../contexts/AuthContext';
import api from '../api/client';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export function useNotifications() {
  const { user } = useAuthContext();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch initial notifications
  useEffect(() => {
    if (!user) return;

    let mounted = true;

    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        const data = res.data?.data || res.data;
        
        if (mounted && Array.isArray(data)) {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.isRead).length);
        }
      } catch (error) {
        console.error('Error fetching initial notifications:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchNotifications();

    return () => {
      mounted = false;
    };
  }, [user]);

  // Listen for real-time notifications via socket
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewNotification = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // We could trigger a toast here if we wanted
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket, user]);

  const markAsRead = async (id: string) => {
    try {
      if (id === 'all') {
        await api.patch(`/notifications/read-all`);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      } else {
        await api.patch(`/notifications/${id}/read`);
        setNotifications((prev) => 
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead
  };
}
