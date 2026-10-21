import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { isRunningInExpoGo } from 'expo';
import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { useNotificationStore, NotificationType } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';

// ─── Configure how push notifications display while app is in foreground ───
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

import { API_URL } from '@/lib/apiConfig';

// Map socket event names → human-readable notification content
const EVENT_MAP: Record<string, { title: string; getBody: (data: any) => string; type: NotificationType }> = {
  'booking:new':           { title: '📅 New Booking',        getBody: (d) => `${d?.customerName ?? 'A customer'} booked ${d?.serviceName ?? 'a service'}`,     type: 'new_booking' },
  'booking:confirmed':     { title: '✅ Booking Confirmed',   getBody: (d) => `Your booking for ${d?.serviceName ?? 'service'} has been confirmed`,              type: 'booking_confirmed' },
  'booking:cancelled':     { title: '❌ Booking Cancelled',   getBody: (d) => `Booking #${d?.bookingId?.slice(-6) ?? ''} was cancelled`,                         type: 'booking_cancelled' },
  'payment:received':      { title: '💰 Payment Received',   getBody: (d) => `$${d?.amount ?? 0} payment received for booking #${d?.bookingId?.slice(-6) ?? ''}`, type: 'payment_received' },
  'message:new':           { title: '💬 New Message',         getBody: (d) => `${d?.senderName ?? 'Someone'}: ${d?.preview ?? 'sent you a message'}`,             type: 'new_message' },
  'job:assigned':          { title: '🔔 Job Assigned',        getBody: (d) => `You have a new job: ${d?.serviceName ?? 'Service'}`,                               type: 'job_assigned' },
  'job:completed':         { title: '🎉 Job Completed',       getBody: (d) => `${d?.staffName ?? 'Staff'} completed ${d?.serviceName ?? 'the job'}`,              type: 'job_completed' },
  'dispute:update':        { title: '⚖️ Dispute Update',      getBody: (d) => `Dispute #${d?.disputeId?.slice(-6) ?? ''} status: ${d?.status ?? 'updated'}`,      type: 'dispute_update' },
  'payout:processed':      { title: '🏦 Payout Processed',   getBody: (d) => `Your payout of $${d?.amount ?? 0} has been processed`,                             type: 'payout_processed' },
  'company:verified':      { title: '🏢 Company Verified',    getBody: (_) => `Your company has been verified and is now live`,                                    type: 'company_verified' },
  'review:received':       { title: '⭐ New Review',          getBody: (d) => `${d?.customerName ?? 'A customer'} left a ${d?.rating ?? 5}-star review`,          type: 'review_received' },
  'support:reply':         { title: '🎫 Support Reply',       getBody: (d) => `Your ticket has been updated: ${d?.preview ?? 'New reply received'}`,               type: 'support_reply' },
};

// ─── Request push permission & get Expo push token ───────────────────────────
async function registerForPushNotifications(): Promise<string | null> {
  // Remote push notifications are unsupported in Expo Go on Android since SDK 53
  if (isRunningInExpoGo() || !Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });
    return token.data;
  } catch {
    return null;
  }
}

// ─── The hook ─────────────────────────────────────────────────────────────────
export function useRealtimeNotifications() {
  const { user } = useAuthStore();
  const { addNotification, setConnected } = useNotificationStore();
  const socketRef = useRef<Socket | null>(null);

  const sendLocalPush = useCallback(
    async (title: string, body: string) => {
      try {
        await Notifications.scheduleNotificationAsync({
          content: { title, body, sound: true },
          trigger: null, // fire immediately
        });
      } catch {
        // non-fatal — local push not critical
      }
    },
    []
  );

  const handleSocketEvent = useCallback(
    (eventName: string, data: any) => {
      const mapping = EVENT_MAP[eventName];
      if (!mapping) return;

      const body = mapping.getBody(data);
      addNotification({ type: mapping.type, title: mapping.title, body, data });
      sendLocalPush(mapping.title, body);
    },
    [addNotification, sendLocalPush]
  );

  useEffect(() => {
    if (!user?.id) return;

    // ── Fetch existing persisted notifications from DB ──
    useNotificationStore.getState().fetchNotifications();

    // ── Register push token with backend ──
    registerForPushNotifications().then(async (token) => {
      if (!token) return;
      try {
        const { api } = await import('@/store/authStore');
        await api.post('/api/notifications/push-token', { pushToken: token });
      } catch {
        // non-critical
      }
    });

    // ── Connect Socket.io ──
    const connectSocket = async () => {
      const authToken = await SecureStore.getItemAsync('authToken');
      if (!authToken) return;

      const socket = io(API_URL, {
        auth: { token: authToken },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      socket.on('connect', () => {
        setConnected(true);
        // Join user-specific room
        socket.emit('join', { userId: user.id, role: user.role });
      });

      socket.on('disconnect', () => setConnected(false));

      socket.on('connect_error', (err) => {
        console.warn('[Socket] Connection error:', err.message);
        setConnected(false);
      });

      // Register all event listeners
      Object.keys(EVENT_MAP).forEach((event) => {
        socket.on(event, (data) => handleSocketEvent(event, data));
      });

      // Presence Tracking
      socket.on('user_status_changed', (data: { userId: string, status: string, lastSeen: string }) => {
        const { usePresenceStore } = require('@/store/presenceStore');
        usePresenceStore.getState().updateStatus(data.userId, data.status, data.lastSeen);
      });

      // Generic fallback for custom events
      socket.on('notification', (data: { type: string; title: string; body: string; payload?: any }) => {
        addNotification({
          type: (data.type as NotificationType) ?? 'new_message',
          title: data.title ?? 'Notification',
          body: data.body ?? '',
          data: data.payload,
        });
        sendLocalPush(data.title ?? 'Notification', data.body ?? '');
      });

      socketRef.current = socket;
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
    };
  }, [user?.id, user?.role]);

  return null; // side-effect only hook
}
