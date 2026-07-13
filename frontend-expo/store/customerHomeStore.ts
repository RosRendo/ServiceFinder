import { create } from 'zustand';
import { api } from './authStore';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  imageUrl?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  image?: string;
  serviceType?: any;
  companyId: string;
  company?: {
    name: string;
    logoUrl?: string;
  };
}

export interface Company {
  id: string;
  name: string;
  city: string;
  logoUrl?: string;
  coverImageUrl?: string;
  description: string;
  cardHighlights?: string[];
  ratingSummary?: {
    averageRating: number;
    totalReviews: number;
  };
}

interface CustomerHomeStore {
  categories: Category[];
  trendingServices: Service[];
  featuredCompanies: Company[];
  recommendedServices: Service[];
  
  // Status
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  
  // Pagination
  page: number;
  hasMore: boolean;

  fetchHomeData: () => Promise<void>;
  loadMoreServices: () => Promise<void>;
}

const extractArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;

  // The backend has a global wrapper: { success: true, data: SERVICE_RESPONSE }
  // So axios response.data = { success: true, data: <actual payload> }
  const inner = data?.data;
  if (inner) {
    if (Array.isArray(inner)) return inner;                    // { success, data: [] }
    if (Array.isArray(inner.data)) return inner.data;          // { success, data: { data: [] } }  ← categories & trending
    if (Array.isArray(inner.companies)) return inner.companies; // { success, data: { companies: [] } } ← companies
    if (Array.isArray(inner.services)) return inner.services;
    if (Array.isArray(inner.items)) return inner.items;
  }

  // Fallback for responses without global wrapper
  if (Array.isArray(data?.companies)) return data.companies;
  if (Array.isArray(data?.items)) return data.items;

  return [];
};

export const useCustomerHomeStore = create<CustomerHomeStore>((set, get) => ({
  categories: [],
  trendingServices: [],
  featuredCompanies: [],
  recommendedServices: [],
  isLoading: false,
  isLoadingMore: false,
  page: 1,
  hasMore: true,
  error: null,

  fetchHomeData: async () => {
    set({ isLoading: true, error: null, page: 1, hasMore: true });
    try {
      // Execute all API requests in parallel
      const [categoriesRes, trendingRes, companiesRes, recommendedRes] = await Promise.all([
        api.get('/api/categories'),
        api.get('/api/services/trending'),
        api.get('/api/companies'),
        api.get('/api/services', { params: { page: 1, limit: 10 } }),
      ]);

      const categories = extractArray(categoriesRes.data);
      const trendingServices = extractArray(trendingRes.data);
      const featuredCompanies = extractArray(companiesRes.data);
      const recommendedServices = extractArray(recommendedRes.data);

      set({
        categories,
        trendingServices,
        featuredCompanies,
        recommendedServices,
        hasMore: recommendedServices.length === 10,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('[HomeStore] Failed to fetch home data:', error?.response?.data || error?.message || error);
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to load data. Please pull down to refresh.' 
      });
    }
  },

  loadMoreServices: async () => {
    const { page, hasMore, isLoadingMore } = get();
    if (!hasMore || isLoadingMore) return;

    set({ isLoadingMore: true });
    try {
      const nextPage = page + 1;
      const res = await api.get('/api/services', { 
        params: { page: nextPage, limit: 10 } 
      });
      const newServices = extractArray(res.data);
      set((state) => ({
        recommendedServices: [...state.recommendedServices, ...newServices],
        page: nextPage,
        hasMore: newServices.length === 10,
        isLoadingMore: false,
      }));
    } catch (error: any) {
      console.error('[HomeStore] loadMore error:', error?.message);
      set({ isLoadingMore: false });
    }
  },
}));
