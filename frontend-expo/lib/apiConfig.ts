import { Platform } from 'react-native';

/**
 * Single source of truth for the backend API base URL.
 *
 * - Development: falls back to the emulator/simulator host (no config needed).
 * - Production: EXPO_PUBLIC_API_URL is REQUIRED — fail fast instead of
 *   silently pointing the app at localhost.
 */

const DEV_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  if (__DEV__) return DEV_URL;
  throw new Error(
    'EXPO_PUBLIC_API_URL is not set. It is required in production builds.',
  );
}

export const API_URL: string = resolveApiUrl();

/** Root URL for Socket.IO (API_URL minus any /api suffix). */
export const SOCKET_URL: string = API_URL.replace(/\/api\/?$/, '');
