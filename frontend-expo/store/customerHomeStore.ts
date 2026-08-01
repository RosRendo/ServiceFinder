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

export interface ServiceType {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
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
  serviceTypes: ServiceType[];
  activeBooking: any | null; // For State-Driven Home
  trendingServices: Service[];
  recommendedServices: Service[];
  topCompanies: Company[];
  
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
  serviceTypes: [],
  activeBooking: null,
  trendingServices: [],
  recommendedServices: [],
  topCompanies: [],
  isLoading: false,
  isLoadingMore: false,
  page: 1,
  hasMore: true,
  error: null,

  fetchHomeData: async () => {
    set({ isLoading: true, error: null, page: 1, hasMore: true });
    try {
      // Execute all API requests in parallel
      const [categoriesRes, serviceTypesRes, servicesRes, bookingsRes, companiesRes] = await Promise.all([
        api.get('/api/categories'),
        api.get('/api/service-types'),
        api.get('/api/services'),
        api.get('/api/bookings').catch(() => ({ data: [] })), // Graceful fallback
        api.get('/api/companies'),
      ]);

      const categories = extractArray(categoriesRes.data);
      const serviceTypes = extractArray(serviceTypesRes.data);
      
      const services = extractArray(servicesRes.data);
      
      const allBookings = extractArray(bookingsRes.data);
      // Find the most urgent active booking (e.g., in_progress or confirmed)
      const activeBooking = allBookings.find(b => ['confirmed', 'in_progress'].includes(b.status)) || null;

      const topCompanies = extractArray(companiesRes.data);

      set({
        categories,
        serviceTypes,
        activeBooking,
        trendingServices: services.slice(0, 5),
        recommendedServices: services.slice(5, 15),
        topCompanies,
        hasMore: false,
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
    // Deprecated for Aggregator MVP
  },
}));
