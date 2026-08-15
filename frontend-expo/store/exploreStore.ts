import { create } from 'zustand';
import { api } from './authStore';

export interface ExploreCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  imageUrl?: string;
  useImageAsBadge?: boolean;
  serviceTypesCount: number;
}

export interface ExploreService {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  durationMin: number;
  image?: string;
  company: {
    id: string;
    name: string;
    city: string;
    logoUrl?: string;
    verified?: boolean;
  };
  serviceType?: {
    name: string;
    imageUrl?: string;
    category?: { 
      name: string; 
      slug: string;
      imageUrl?: string;
    };
  };
  bookingCount?: number;
  distanceKm?: number | null;
}

export interface ExploreCompany {
  id: string;
  name: string;
  city: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  cardHighlights?: string[];
  verificationStatus?: string;
  distance?: number;
  ratingSummary?: {
    averageRating: number;
    totalReviews: number;
  };
  _count?: { services: number; bookings: number };
}

interface ExploreStore {
  // Data
  categories: ExploreCategory[];
  services: ExploreService[];
  companies: ExploreCompany[];
  searchQuery: string;
  activeCategory: string | null;

  // Status
  isLoading: boolean;
  isSearching: boolean;
  isLoadingMore: boolean;
  error: string | null;

  // Pagination
  page: number;
  hasMore: boolean;

  // Actions
  fetchExploreData: (filters?: any) => Promise<void>;
  loadMoreServices: (filters?: any) => Promise<void>;
  searchServices: (query: string, filters?: any) => Promise<void>;
  setActiveCategory: (slug: string | null) => void;
  setSearchQuery: (q: string) => void;
  reset: () => void;
}

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

export const useExploreStore = create<ExploreStore>((set, get) => ({
  categories: [],
  services: [],
  companies: [],
  searchQuery: '',
  activeCategory: null,
  isLoading: false,
  isSearching: false,
  isLoadingMore: false,
  page: 1,
  hasMore: true,
  error: null,

  fetchExploreData: async (filters: any = {}) => {
    set({ isLoading: true, error: null, page: 1, hasMore: true });
    try {
      const [categoriesRes, servicesRes, companiesRes] = await Promise.all([
        api.get('/api/categories'),
        api.get('/api/services', { params: { page: 1, limit: 20, ...filters } }),
        api.get('/api/companies', { params: { ...filters } }),
      ]);

      const newServices = extractArray(servicesRes.data);
      set({
        categories: extractArray(categoriesRes.data),
        services: newServices,
        companies: extractArray(companiesRes.data),
        hasMore: newServices.length === 20,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('[ExploreStore] fetch error:', error?.message);
      set({ isLoading: false, error: 'Failed to load explore data.' });
    }
  },

  loadMoreServices: async (filters: any = {}) => {
    const { page, hasMore, isLoadingMore, isSearching, searchQuery } = get();
    if (!hasMore || isLoadingMore) return;

    set({ isLoadingMore: true });
    try {
      const nextPage = page + 1;
      const res = await api.get('/api/services', { 
        params: { 
          page: nextPage, 
          limit: 20,
          ...(isSearching && searchQuery ? { search: searchQuery } : {}),
          ...filters
        } 
      });
      const newServices = extractArray(res.data);
      set((state) => ({
        services: [...state.services, ...newServices],
        page: nextPage,
        hasMore: newServices.length === 20,
        isLoadingMore: false,
      }));
    } catch (error: any) {
      console.error('[ExploreStore] loadMore error:', error?.message);
      set({ isLoadingMore: false });
    }
  },

  searchServices: async (query: string, filters: any = {}) => {
    if (!query.trim()) {
      // Clear search — reload full data
      get().fetchExploreData(filters);
      return;
    }
    set({ isSearching: true });
    try {
      const [servicesRes, companiesRes] = await Promise.all([
        api.get('/api/services', { params: { search: query, page: 1, limit: 20, ...filters } }),
        api.get('/api/companies', { params: { search: query, limit: 10, ...filters } }),
      ]);
      const newServices = extractArray(servicesRes.data);
      set({
        services: newServices,
        companies: extractArray(companiesRes.data),
        page: 1,
        hasMore: newServices.length === 20,
        isSearching: false,
      });
    } catch (error: any) {
      console.error('[ExploreStore] search error:', error?.message);
      set({ isSearching: false });
    }
  },

  setActiveCategory: (slug) => set({ activeCategory: slug }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  reset: () => set({ searchQuery: '', activeCategory: null }),
}));
