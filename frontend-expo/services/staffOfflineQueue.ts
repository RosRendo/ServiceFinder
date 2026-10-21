import AsyncStorage from '@react-native-async-storage/async-storage';
import { AxiosInstance } from 'axios';

const QUEUE_STORAGE_KEY = '@staff_offline_queue_v1';

export interface OfflineAction {
  id: string;
  bookingId: string;
  type: 'en_route' | 'arrive' | 'start' | 'progress' | 'complete' | 'status';
  status?: string;
  photo?: string;
  cashCollected?: number;
  progressPercent?: number;
  checklist?: any[];
  staffNotes?: string;
  timestamp: number;
}

export async function getOfflineQueue(): Promise<OfflineAction[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to read offline queue from AsyncStorage:', e);
    return [];
  }
}

export async function enqueueOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp'>): Promise<OfflineAction> {
  const newAction: OfflineAction = {
    ...action,
    id: `offline_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    timestamp: Date.now(),
  };

  try {
    const queue = await getOfflineQueue();
    queue.push(newAction);
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('Failed to enqueue offline action:', e);
  }

  return newAction;
}

export async function removeOfflineAction(id: string): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    const filtered = queue.filter((item) => item.id !== id);
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to remove offline action:', e);
  }
}

export async function processOfflineQueue(api: AxiosInstance): Promise<{ synced: number; failed: number }> {
  const queue = await getOfflineQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      if (item.type === 'en_route') {
        await api.patch(`/api/bookings/${item.bookingId}/en-route`);
      } else if (item.type === 'arrive') {
        await api.patch(`/api/bookings/${item.bookingId}/arrive`);
      } else if (item.type === 'start') {
        await api.patch(`/api/bookings/${item.bookingId}/start`);
      } else if (item.type === 'progress') {
        await api.patch(`/api/bookings/${item.bookingId}/progress`, {
          progressPercent: item.progressPercent,
          checklist: item.checklist,
          staffNotes: item.staffNotes,
        });
      } else if (item.type === 'complete') {
        await api.patch(`/api/bookings/${item.bookingId}/complete`, {
          proofOfWorkPhoto: item.photo,
          cashCollected: item.cashCollected,
          staffNotes: item.staffNotes,
        });
      } else if (item.type === 'status' && item.status) {
        await api.patch(`/api/bookings/${item.bookingId}/status`, { status: item.status });
      }

      await removeOfflineAction(item.id);
      synced++;
    } catch (e) {
      console.warn(`Failed to sync offline action ${item.id}:`, e);
      failed++;
      break; // Pause until next sync cycle
    }
  }

  return { synced, failed };
}
