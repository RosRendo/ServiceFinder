import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, useAuthStore } from './authStore';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  imageUrl?: string;
  useImageAsBadge?: boolean;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  image?: string;
  serviceType?: any;
  companyId: string;
  distanceKm?: number | null;
  company?: {
    name: string;
    logoUrl?: string;
  };
}

interface CustomerHomeStore {
  categories: Category[];
  activeBooking: any | null; // For State-Driven Home
  recommendedServices: Service[];

  // Status
  isLoading: boolean;
  isLoadingMore: boolean;
  isBackgroundRefreshing: boolean;
  error: string | null;

  // Pagination
  page: number;
  hasMore: boolean;

  fetchHomeData: (latitude?: number, longitude?: number) => Promise<void>;
  loadMoreServices: () => Promise<void>;
}

const HOME_CACHE_KEY = 'cache:customer_home_v2';

const extractArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;

  const inner = data?.data;
  if (inner) {
    if (Array.isArray(inner)) return inner;
    if (Array.isArray(inner.data)) return inner.data;
    if (Array.isArray(inner.companies)) return inner.companies;
    if (Array.isArray(inner.services)) return inner.services;
    if (Array.isArray(inner.items)) return inner.items;
  }

  if (Array.isArray(data?.companies)) return data.companies;
  if (Array.isArray(data?.items)) return data.items;

  return [];
};

export const useCustomerHomeStore = create<CustomerHomeStore>((set, get) => ({
  categories: [],
  activeBooking: null,
  recommendedServices: [],
  isLoading: false,
  isLoadingMore: false,
  isBackgroundRefreshing: false,
  page: 1,
  hasMore: true,
  error: null,

  fetchHomeData: async (latitude?: number, longitude?: number) => {
    const state = get();
    const hasDataInMemory = state.categories.length > 0;

    // 1. Instant Cache Hydration: If memory is empty, check persistent disk cache
    if (!hasDataInMemory) {
      try {
        const cachedRaw = await AsyncStorage.getItem(HOME_CACHE_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (cached?.categories?.length > 0) {
            set({
              categories: cached.categories || [],
              recommendedServices: cached.recommendedServices || [],
              isLoading: false,
              isBackgroundRefreshing: true,
            });
          }
        }
      } catch {
        // Fallback silently
      }
    }

    // Only show full blocking loader if we have NO data to show yet
    const currentlyHasData = get().categories.length > 0;
    if (!currentlyHasData) {
      set({ isLoading: true, error: null, page: 1, hasMore: true });
    } else {
      set({ isBackgroundRefreshing: true, error: null });
    }

    try {
      const servicesParams = latitude && longitude ? { lat: latitude, lng: longitude } : {};
      
      // Stop 401 loop: Only fetch user bookings if user is authenticated
      const currentUser = useAuthStore.getState().user;
      const bookingsPromise = currentUser
        ? api.get('/api/bookings').catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] });

      // Execute all API requests in parallel with silent fallbacks
      const [categoriesRes, servicesRes, bookingsRes] = await Promise.all([
        api.get('/api/categories').catch(() => ({ data: [] })),
        api.get('/api/services', { params: servicesParams }).catch(() => ({ data: [] })),
        bookingsPromise,
      ]);

      const categories = extractArray(categoriesRes.data);
      const services = extractArray(servicesRes.data);
      const allBookings = extractArray(bookingsRes.data);
      const activeBooking = allBookings.find((b: any) => ['confirmed', 'in_progress'].includes(b.status)) || null;

      const nextPayload = {
        categories: categories.length > 0 ? categories : get().categories,
        activeBooking,
        recommendedServices: services.length > 0 ? services.slice(5) : get().recommendedServices,
        hasMore: false,
        isLoading: false,
        isBackgroundRefreshing: false,
      };

      set(nextPayload);

      // Save fresh data to persistent cache for instant 0ms startup next time
      AsyncStorage.setItem(
        HOME_CACHE_KEY,
        JSON.stringify({
          categories: nextPayload.categories,
          recommendedServices: nextPayload.recommendedServices,
        })
      ).catch(() => {});
    } catch (error: any) {
      console.error('[HomeStore] Failed to fetch home data:', error?.response?.data || error?.message || error);
      set({ 
        isLoading: false, 
        isBackgroundRefreshing: false,
        error: get().categories.length === 0 ? 'Failed to load data. Please pull down to refresh.' : null 
      });
    }
  },

  loadMoreServices: async () => {
    // Deprecated for Aggregator MVP
  },
}));
