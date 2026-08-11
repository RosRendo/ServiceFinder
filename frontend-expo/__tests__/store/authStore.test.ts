// Mock SecureStore before any imports
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { useAuthStore , api } from '../../store/authStore';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock axios
jest.mock('axios', () => {
  const mockAxios: any = {
    create: jest.fn(() => mockAxios),
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    defaults: { headers: { common: {} } },
  };
  return { default: mockAxios, ...mockAxios };
});

// Mock expo-router
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }) }));
Platform.OS = 'ios';

const mockUser = {
  id: '1',
  email: 'test@example.com',
  role: 'customer' as const,
  name: 'Test User',
};

describe('authStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the store state to defaults
    useAuthStore.setState({ user: null, isLoading: true });
  });

  // ─── login ────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('should save token to AsyncStorage and set user on successful login', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { token: 'mock-jwt-token', user: mockUser },
      });

      await useAuthStore.getState().login('test@example.com', 'Password1!');

      expect(api.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@example.com',
        password: 'Password1!',
      });
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('authToken', 'mock-jwt-token');
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('should throw and NOT set user on failed login', async () => {
      (api.post as jest.Mock).mockRejectedValueOnce(new Error('Invalid credentials'));

      await expect(
        useAuthStore.getState().login('bad@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');

      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  // ─── register ─────────────────────────────────────────────────────────────

  describe('register', () => {
    it('should register a user, save token and set user state', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { token: 'register-token', user: mockUser },
      });

      await useAuthStore.getState().register('Test User', 'test@example.com', 'Password1!');

      expect(api.post).toHaveBeenCalledWith('/api/auth/register', {
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'Password1!',
        role: 'customer',
      });
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('authToken', 'register-token');
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('should default role to "customer" when no role provided', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { token: 'tk', user: mockUser },
      });

      await useAuthStore.getState().register('Test', 'test@example.com', 'Password1!');

      expect(api.post).toHaveBeenCalledWith(
        '/api/auth/register',
        expect.objectContaining({ role: 'customer' })
      );
    });
  });

  // ─── googleLogin ──────────────────────────────────────────────────────────

  describe('googleLogin', () => {
    it('should set user and save token on successful Google login', async () => {
      const googleUser = { ...mockUser, email: 'google@gmail.com' };
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { token: 'google-token', user: googleUser },
      });

      await useAuthStore.getState().googleLogin('google_id_token');

      expect(api.post).toHaveBeenCalledWith('/api/auth/google', {
        token: 'google_id_token',
        role: 'customer',
      });
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('authToken', 'google-token');
      expect(useAuthStore.getState().user).toEqual(googleUser);
    });
  });

  // ─── facebookLogin ────────────────────────────────────────────────────────

  describe('facebookLogin', () => {
    it('should set user and save token on successful Facebook login', async () => {
      const fbUser = { ...mockUser, email: 'fb@facebook.com' };
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { token: 'fb-token', user: fbUser },
      });

      await useAuthStore.getState().facebookLogin('fb_access_token');

      expect(api.post).toHaveBeenCalledWith('/api/auth/facebook', {
        token: 'fb_access_token',
        role: 'customer',
      });
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('authToken', 'fb-token');
      expect(useAuthStore.getState().user).toEqual(fbUser);
    });
  });

  // ─── checkAuth ────────────────────────────────────────────────────────────

  describe('checkAuth', () => {
    it('should restore user from valid stored token', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
        if (key === 'hasSeenOnboarding') return Promise.resolve('true');
        if (key === 'authToken') return Promise.resolve('stored-token');
        return Promise.resolve(null);
      });
      (api.get as jest.Mock).mockResolvedValueOnce({ data: { data: mockUser } });

      await useAuthStore.getState().checkAuth();

      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should clear user and set isLoading=false when no token in storage', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
        if (key === 'hasSeenOnboarding') return Promise.resolve('true');
        if (key === 'authToken') return Promise.resolve(null);
        return Promise.resolve(null);
      });

      await useAuthStore.getState().checkAuth();

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should clear auth on 401 from /api/auth/me', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
        if (key === 'hasSeenOnboarding') return Promise.resolve('true');
        if (key === 'authToken') return Promise.resolve('expired-token');
        return Promise.resolve(null);
      });
      const error: any = new Error('Unauthorized');
      error.response = { status: 401 };
      (api.get as jest.Mock).mockRejectedValueOnce(error);

      await useAuthStore.getState().checkAuth();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('authToken');
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should NOT clear user on network error (keep cached state)', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
        if (key === 'hasSeenOnboarding') return Promise.resolve('true');
        if (key === 'authToken') return Promise.resolve('valid-token');
        return Promise.resolve(null);
      });
      const networkError = new Error('Network Error');
      // No .response property = network error
      (api.get as jest.Mock).mockRejectedValueOnce(networkError);

      // Pre-set user to simulate cached state
      useAuthStore.setState({ user: mockUser });
      await useAuthStore.getState().checkAuth();

      // User should still be set (network errors don't log out)
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  // ─── logout ───────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('should clear token from storage and set user to null', async () => {
      useAuthStore.setState({ user: mockUser });
      (api.post as jest.Mock).mockResolvedValueOnce({});

      await useAuthStore.getState().logout();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('authToken');
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('should still clear local state even if server logout call fails', async () => {
      useAuthStore.setState({ user: mockUser });
      (api.post as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));

      await useAuthStore.getState().logout();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('authToken');
      expect(useAuthStore.getState().user).toBeNull();
    });
  });
});
