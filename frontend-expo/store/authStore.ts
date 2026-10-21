// store/authStore.ts
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';

// Dynamically handle localhost based on platform (Android emulator uses 10.0.2.2)
// NestJS runs on port 5000 and uses the '/api' global prefix
const defaultApiUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
const API_URL = process.env.EXPO_PUBLIC_API_URL || defaultApiUrl;

// Configure axios instance globally for the store
export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds timeout so it doesn't hang forever
  headers: {
    'Content-Type': 'application/json',
  },
});

// Always attach token from storage before every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('authToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Token Refresh Logic Variables
let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};

// Standardize API error messages globally and handle token refresh
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if 401 Unauthorized and we haven't already retried
    if (error?.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        try {
          const token = await new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token using a refresh endpoint
        // NOTE: This assumes your backend has a /api/auth/refresh endpoint
        // and you are storing a refreshToken. For this boilerplate, we'll
        // simulate the clear logic if refresh fails.
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) {
          // Unauthenticated or guest mode: do NOT attempt refresh, do NOT wipe user in a loop
          processQueue(error, null);
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
        const { accessToken: newToken, refreshToken: newRefreshToken } = response.data;
        
        await SecureStore.setItemAsync('authToken', newToken);
        if (newRefreshToken) {
          await SecureStore.setItemAsync('refreshToken', newRefreshToken);
        }
        
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        
        processQueue(null, newToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await SecureStore.deleteItemAsync('authToken');
        await SecureStore.deleteItemAsync('refreshToken');
        delete api.defaults.headers.common['Authorization'];
        // Only reset user if an authenticated user session was active
        if (useAuthStore.getState().user) {
          useAuthStore.getState().setUser(null);
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Format error message to be more user friendly
    let formattedError = "An unexpected error occurred";
    if (error.response) {
      const data = error.response.data;
      if (typeof data.message === 'string') {
        formattedError = data.message;
      } else if (Array.isArray(data.message)) {
        formattedError = data.message[0];
      } else if (data.error) {
        formattedError = data.error;
      } else {
        formattedError = `Error: ${error.response.status}`;
      }
    } else if (error.request) {
      formattedError = "Network error. Please check your connection.";
      Toast.show({
        type: 'error',
        text1: 'Connection Lost',
        text2: formattedError,
        position: 'top',
        topOffset: 50,
      });
    } else {
      formattedError = error.message || formattedError;
    }
    
    error.formattedMessage = formattedError;

    return Promise.reject(error);
  }
);

interface User {
  id: string;
  email: string;
  role: 'customer' | 'staff' | 'company' | 'company_admin' | 'admin';
  name: string;
  fullName?: string;
  avatarUrl?: string;
  avatar?: string;
  phone?: string;
  staffProfile?: any;
}

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  token: string | null;
  isGuest: boolean;
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (val: boolean) => Promise<void>;
  setGuestMode: (value: boolean) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ requiresMfa: boolean; tempMfaToken: any } | void>;
  verifyMfa: (token: string, code: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  googleLogin: (token: string, role?: string) => Promise<void>;
  facebookLogin: (token: string, role?: string) => Promise<void>;
  appleLogin: (token: string, fullName?: { givenName?: string; familyName?: string }, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

// Dev mock is now disabled for production API usage
const USE_DEV_MOCK = false;

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true, // Initially loading while we check token
  token: null,
  isGuest: false,
  hasSeenOnboarding: false,
  setHasSeenOnboarding: async (val) => {
    if (val) {
      await SecureStore.setItemAsync('hasSeenOnboarding', 'true');
    } else {
      await SecureStore.deleteItemAsync('hasSeenOnboarding');
    }
    set({ hasSeenOnboarding: val });
  },
  setGuestMode: (value) => set({ isGuest: value }),
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ isLoading: loading }),

  checkAuth: async () => {
    try {
      const onboardingFlag = await SecureStore.getItemAsync('hasSeenOnboarding');
      if (onboardingFlag === 'true') {
        set({ hasSeenOnboarding: true });
      }

      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        set({ user: null, isLoading: false });
        return;
      }
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await api.get('/api/auth/me');
      let userData = response.data?.data?.user ?? response.data?.data ?? response.data;
      
      // Fallback: If backend didn't attach staffProfile, fetch it via /api/users/:id
      if (userData?.role === 'staff' && !userData.staffProfile && userData.id) {
        try {
          const userRes = await api.get(`/api/users/${userData.id}`);
          const fetchedUser = userRes.data?.data?.user || userRes.data?.user || userRes.data;
          const memberships = fetchedUser?.staffMemberships;
          if (memberships && memberships.length > 0) {
            userData.staffProfile = memberships[0];
          }
        } catch (e) {
          console.error("Failed to fetch staff profile fallback:", e);
        }
      }
      
      set({ user: userData, isLoading: false, isGuest: false });
    } catch (error: any) {
      if (error?.response?.status === 401) {
        await SecureStore.deleteItemAsync('authToken');
        delete api.defaults.headers.common['Authorization'];
        set({ user: null, isLoading: false, isGuest: false });
      } else {
        set({ isLoading: false });
      }
    }
  },

  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      
      if (response.data?.requiresMfa) {
        return { requiresMfa: true, tempMfaToken: response.data.tempMfaToken };
      }

      let user = response.data?.user || response.data?.data?.user;
      const accessToken = response.data?.token || response.data?.accessToken || response.data?.data?.token || response.data?.data?.accessToken;
      const refreshToken = response.data?.refreshToken || response.data?.data?.refreshToken;

      if (accessToken) await SecureStore.setItemAsync('authToken', accessToken);
      if (refreshToken) await SecureStore.setItemAsync('refreshToken', refreshToken);
      if (accessToken) api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      // Fallback: If backend didn't attach staffProfile, fetch it via /api/users/:id
      if (user?.role === 'staff' && !user.staffProfile && user.id) {
        try {
          const userRes = await api.get(`/api/users/${user.id}`);
          const fetchedUser = userRes.data?.data?.user || userRes.data?.user || userRes.data;
          const memberships = fetchedUser?.staffMemberships;
          if (memberships && memberships.length > 0) {
            user.staffProfile = memberships[0];
          }
        } catch (e) {
          console.error("Failed to fetch staff profile fallback:", e);
        }
      }
      
      set({ user, isGuest: false });
    } catch (error) {
      throw error;
    }
  },

  verifyMfa: async (tempToken: string, code: string) => {
    try {
      const response = await api.post('/api/auth/mfa/verify', { tempToken, code });
      let user = response.data?.user || response.data?.data?.user;
      const accessToken = response.data?.token || response.data?.accessToken || response.data?.data?.token || response.data?.data?.accessToken;
      const refreshToken = response.data?.refreshToken || response.data?.data?.refreshToken;

      if (accessToken) await SecureStore.setItemAsync('authToken', accessToken);
      if (refreshToken) await SecureStore.setItemAsync('refreshToken', refreshToken);
      if (accessToken) api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      set({ user, isGuest: false });
    } catch (error) {
      throw error;
    }
  },

  verifyOtp: async (phone: string, code: string) => {
    try {
      const response = await api.post('/api/auth/verify-otp', { phone, code });
      let user = response.data?.user || response.data?.data?.user;
      const accessToken = response.data?.token || response.data?.accessToken || response.data?.data?.token || response.data?.data?.accessToken;
      const refreshToken = response.data?.refreshToken || response.data?.data?.refreshToken;

      if (accessToken) await SecureStore.setItemAsync('authToken', accessToken);
      if (refreshToken) await SecureStore.setItemAsync('refreshToken', refreshToken);
      if (accessToken) api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      // Fallback: If backend didn't attach staffProfile, fetch it via /api/users/:id
      if (user?.role === 'staff' && !user.staffProfile && user.id) {
        try {
          const userRes = await api.get(`/api/users/${user.id}`);
          const fetchedUser = userRes.data?.data?.user || userRes.data?.user || userRes.data;
          const memberships = fetchedUser?.staffMemberships;
          if (memberships && memberships.length > 0) {
            user.staffProfile = memberships[0];
          }
        } catch (e) {
          console.error("Failed to fetch staff profile fallback:", e);
        }
      }
      
      set({ user, isGuest: false });
    } catch (error) {
      throw error;
    }
  },

  register: async (name: string, email: string, password: string, role = 'customer') => {
    try {
      const response = await api.post('/api/auth/register', { fullName: name, email, password, role });
      const user = response.data?.user || response.data?.data?.user;
      const accessToken = response.data?.token || response.data?.accessToken || response.data?.data?.token || response.data?.data?.accessToken;
      const refreshToken = response.data?.refreshToken || response.data?.data?.refreshToken;
      
      if (accessToken) await SecureStore.setItemAsync('authToken', accessToken);
      if (refreshToken) await SecureStore.setItemAsync('refreshToken', refreshToken);
      if (accessToken) api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      set({ user, isGuest: false });
    } catch (error) {
      throw error;
    }
  },

  googleLogin: async (token: string, role = 'customer') => {
    try {
      const response = await api.post('/api/auth/google', { token, role });
      const user = response.data?.user || response.data?.data?.user;
      const accessToken = response.data?.token || response.data?.accessToken || response.data?.data?.token || response.data?.data?.accessToken;
      const refreshToken = response.data?.refreshToken || response.data?.data?.refreshToken;
      
      if (accessToken) await SecureStore.setItemAsync('authToken', accessToken);
      if (refreshToken) await SecureStore.setItemAsync('refreshToken', refreshToken);
      if (accessToken) api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      set({ user, isGuest: false });
    } catch (error) {
      throw error;
    }
  },

  facebookLogin: async (token: string, role = 'customer') => {
    try {
      const response = await api.post('/api/auth/facebook', { token, role });
      const user = response.data?.user || response.data?.data?.user;
      const accessToken = response.data?.token || response.data?.accessToken || response.data?.data?.token || response.data?.data?.accessToken;
      const refreshToken = response.data?.refreshToken || response.data?.data?.refreshToken;
      
      if (accessToken) await SecureStore.setItemAsync('authToken', accessToken);
      if (refreshToken) await SecureStore.setItemAsync('refreshToken', refreshToken);
      if (accessToken) api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      set({ user, isGuest: false });
    } catch (error) {
      throw error;
    }
  },

  appleLogin: async (token: string, fullName?: { givenName?: string; familyName?: string }, role = 'customer') => {
    try {
      const response = await api.post('/api/auth/apple', { identityToken: token, fullName, role });
      const user = response.data?.user || response.data?.data?.user;
      const accessToken = response.data?.token || response.data?.accessToken || response.data?.data?.token || response.data?.data?.accessToken;
      const refreshToken = response.data?.refreshToken || response.data?.data?.refreshToken;
      
      if (accessToken) await SecureStore.setItemAsync('authToken', accessToken);
      if (refreshToken) await SecureStore.setItemAsync('refreshToken', refreshToken);
      if (accessToken) api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      set({ user, isGuest: false });
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch(e) {
      // ignore logout failure on backend if network error
    }
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('refreshToken');
    delete api.defaults.headers.common['Authorization'];
    set({ user: null, isGuest: true });
  },

  deleteAccount: async () => {
    try {
      await api.delete('/api/users/me');
    } catch(e) {
      console.error('Failed to delete account from backend', e);
      throw e;
    }
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('refreshToken');
    delete api.defaults.headers.common['Authorization'];
    set({ user: null, isGuest: false });
  },
}));
