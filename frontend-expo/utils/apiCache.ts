import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes default

interface CacheItem {
  data: any;
  timestamp: number;
}

export const apiCache = {
  /**
   * Fetches from API and caches the result. If the API fails (e.g. offline),
   * it returns the cached version if available.
   */
  async get(url: string, params: any = {}, expiry: number = CACHE_EXPIRY_MS): Promise<any> {
    const cacheKey = `cache:${url}:${JSON.stringify(params)}`;

    try {
      // 1. Try to fetch fresh data from network
      const response = await api.get(url, { params });
      
      // 2. If successful, cache it
      const cacheItem: CacheItem = {
        data: response.data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheItem));
      
      return response.data;
    } catch (error: any) {
      // 3. Network failed. Try to fallback to cache
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const parsedCache: CacheItem = JSON.parse(cached);
          const isExpired = Date.now() - parsedCache.timestamp > expiry;
          
          if (!isExpired) {
            console.warn(`[apiCache] Network failed, using cached data for ${url}`);
            return parsedCache.data;
          } else {
            console.warn(`[apiCache] Cache expired for ${url}`);
          }
        } catch (e) {
          // ignore parsing error
        }
      }
      
      // 4. No valid cache, throw original error
      throw error;
    }
  },

  /**
   * Manually invalidate a cache key (e.g., after a mutation)
   */
  async invalidate(url: string, params: any = {}) {
    const cacheKey = `cache:${url}:${JSON.stringify(params)}`;
    await AsyncStorage.removeItem(cacheKey);
  },
  
  /**
   * Clear all cached data
   */
  async clearAll() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith('cache:'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (e) {
      console.error("[apiCache] Error clearing cache", e);
    }
  }
};
