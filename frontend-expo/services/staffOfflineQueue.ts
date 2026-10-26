import AsyncStorage from '@react-native-async-storage/async-storage';
import { AxiosInstance } from 'axios';

const QUEUE_STORAGE_KEY = '@staff_offline_queue_v1';
const MAX_ATTEMPTS = 3;

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
  attempts?: number;
  failed?: boolean;
  lastError?: string;
}

async function persistQueue(queue: OfflineAction[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('Failed to persist offline queue:', e);
  }
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
    attempts: 0,
    failed: false,
  };

  try {
    const queue = await getOfflineQueue();
    queue.push(newAction);
    await persistQueue(queue);
  } catch (e) {
    console.warn('Failed to enqueue offline action:', e);
  }

  return newAction;
}

export async function removeOfflineAction(id: string): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    const filtered = queue.filter((item) => item.id !== id);
    await persistQueue(filtered);
  } catch (e) {
    console.warn('Failed to remove offline action:', e);
  }
}

export async function getFailedOfflineActions(): Promise<OfflineAction[]> {
  const queue = await getOfflineQueue();
  return queue.filter((item) => item.failed);
}

export async function retryFailedOfflineActions(): Promise<void> {
  const queue = await getOfflineQueue();
  const reset = queue.map((item) => (item.failed ? { ...item, failed: false, attempts: 0, lastError: undefined } : item));
  await persistQueue(reset);
}

const isFatal = (e: any): boolean => {
  const status = e?.response?.status;
  if (status === undefined) return false;
  return status === 400 || status === 401 || status === 403 || status === 404 || status === 409 || status === 422;
};

export async function processOfflineQueue(api: AxiosInstance): Promise<{ synced: number; failed: number; skipped: number }> {
  const queue = await getOfflineQueue();
  if (queue.length === 0) return { synced: 0, failed: 0, skipped: 0 };

  let synced = 0;
  let failed = 0;
  let skipped = 0;
  let mutated = false;

  for (const item of queue) {
    if (item.failed) {
      skipped++;
      continue;
    }

    const attempts = (item.attempts ?? 0) + 1;

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

      const idx = queue.findIndex((q) => q.id === item.id);
      if (idx !== -1) {
        queue.splice(idx, 1);
        mutated = true;
      }
      synced++;
    } catch (e: any) {
      const idx = queue.findIndex((q) => q.id === item.id);
      if (idx !== -1) {
        const exhausted = attempts >= MAX_ATTEMPTS || isFatal(e);
        queue[idx] = {
          ...item,
          attempts: exhausted ? attempts : attempts,
          failed: exhausted,
          lastError: String(e?.response?.data?.message ?? e?.message ?? e).slice(0, 200),
        };
        mutated = true;
      }
      failed++;
      if (!isFatal(e)) continue;
    }
  }

  if (mutated) {
    await persistQueue(queue);
  }

  return { synced, failed, skipped };
}
