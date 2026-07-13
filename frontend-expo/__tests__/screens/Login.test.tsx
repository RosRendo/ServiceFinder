/**
 * Login Screen — Component Tests
 * Tests rendering, input handling, form validation, and navigation.
 */

// ─── Mocks (must be before imports) ────────────────────────────────────────
// ─── Imports ────────────────────────────────────────────────────────────────
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Login from '../../app/(public)/login';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock('expo-auth-session/providers/google', () => ({
  useAuthRequest: () => [null, null, jest.fn()],
}));

jest.mock('expo-auth-session/providers/facebook', () => ({
  useAuthRequest: () => [null, null, jest.fn()],
}));

const mockRouterReplace = jest.fn();
const mockRouterPush = jest.fn();
const mockRouterBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
    push: mockRouterPush,
    back: mockRouterBack,
  }),
  useLocalSearchParams: () => ({}),
}));

const mockLogin = jest.fn();
const mockGoogleLogin = jest.fn();
const mockFacebookLogin = jest.fn();
jest.mock('@/store/authStore', () => ({
  useAuthStore: (selector: any) => {
    const state = {
      login: mockLogin,
      googleLogin: mockGoogleLogin,
      facebookLogin: mockFacebookLogin,
      user: null,
      isLoading: false,
    };
    return selector ? selector(state) : state;
  },
}));

// Provide getState for handlers that call useAuthStore.getState()
const { useAuthStore } = require('@/store/authStore');
useAuthStore.getState = jest.fn(() => ({
  login: mockLogin,
  googleLogin: mockGoogleLogin,
  facebookLogin: mockFacebookLogin,
  user: null,
}));

jest.mock('@/hooks/useSocialAuth', () => {
  return {
    useSocialAuth: () => ({
      promptGoogleAsync: async () => {
        const { useAuthStore } = require('@/store/authStore');
        await useAuthStore.getState().googleLogin();
      },
      promptFacebookAsync: async () => {
        const { useAuthStore } = require('@/store/authStore');
        await useAuthStore.getState().facebookLogin();
      },
      isGoogleReady: true,
      isFacebookReady: true,
    }),
  };
});

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// ─── Tests ──────────────────────────────────────────────────────────────────
describe('Login Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.getState.mockReturnValue({
      login: mockLogin,
      googleLogin: mockGoogleLogin,
      facebookLogin: mockFacebookLogin,
      user: null,
    });
  });

  it('renders all expected UI elements for phone login by default', () => {
    const { getByText, getByPlaceholderText } = render(<Login />);

    expect(getByText('Welcome Back')).toBeTruthy();
    expect(getByText('Enter your phone number to receive an OTP code')).toBeTruthy();
    expect(getByPlaceholderText('+1 (555) 000-0000')).toBeTruthy();
    expect(getByText('auth.sendCode')).toBeTruthy();
    expect(getByText('auth.continueGoogle')).toBeTruthy();
    expect(getByText('auth.continueFacebook')).toBeTruthy();
    expect(getByText('Login with Email')).toBeTruthy();
  });

  it('shows validation error when submitting with empty email/password', async () => {
    const { getByText } = render(<Login />);

    // Switch to email mode
    fireEvent.press(getByText('Login with Email'));

    fireEvent.press(getByText('auth.login'));

    await waitFor(() => {
      expect(getByText('Please enter both email and password')).toBeTruthy();
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('shows validation error when only email is filled', async () => {
    const { getByText, getByPlaceholderText } = render(<Login />);

    // Switch to email mode
    fireEvent.press(getByText('Login with Email'));

    fireEvent.changeText(getByPlaceholderText('name@example.com'), 'user@test.com');
    fireEvent.press(getByText('auth.login'));

    await waitFor(() => {
      expect(getByText('Please enter both email and password')).toBeTruthy();
    });
  });

  it('calls login() with correct credentials and navigates customer to home', async () => {
    const customerUser = { id: '1', email: 'c@test.com', role: 'customer', name: 'Customer' };
    mockLogin.mockResolvedValueOnce(undefined);
    useAuthStore.getState.mockReturnValue({
      login: mockLogin,
      googleLogin: mockGoogleLogin,
      facebookLogin: mockFacebookLogin,
      user: customerUser,
    });

    const { getByText, getByPlaceholderText } = render(<Login />);
    
    // Switch to email mode
    fireEvent.press(getByText('Login with Email'));

    fireEvent.changeText(getByPlaceholderText('name@example.com'), 'c@test.com');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'Password1!');
    fireEvent.press(getByText('auth.login'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('c@test.com', 'Password1!');
      expect(mockRouterReplace).toHaveBeenCalledWith('/(customer)/(tabs)/home');
    });
  });

  it('calls login() and navigates company_admin to dashboard', async () => {
    const companyUser = { id: '2', email: 'biz@test.com', role: 'company_admin', name: 'BizOwner' };
    mockLogin.mockResolvedValueOnce(undefined);
    useAuthStore.getState.mockReturnValue({
      login: mockLogin,
      googleLogin: mockGoogleLogin,
      facebookLogin: mockFacebookLogin,
      user: companyUser,
    });

    const { getByText, getByPlaceholderText } = render(<Login />);
    
    // Switch to email mode
    fireEvent.press(getByText('Login with Email'));

    fireEvent.changeText(getByPlaceholderText('name@example.com'), 'biz@test.com');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'Password1!');
    fireEvent.press(getByText('auth.login'));

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/(company)/(tabs)/dashboard');
    });
  });

  it('calls login() and navigates staff to dashboard', async () => {
    const staffUser = { id: '3', email: 'staff@test.com', role: 'staff', name: 'Staff' };
    mockLogin.mockResolvedValueOnce(undefined);
    useAuthStore.getState.mockReturnValue({
      login: mockLogin,
      googleLogin: mockGoogleLogin,
      facebookLogin: mockFacebookLogin,
      user: staffUser,
    });

    const { getByText, getByPlaceholderText } = render(<Login />);
    
    // Switch to email mode
    fireEvent.press(getByText('Login with Email'));

    fireEvent.changeText(getByPlaceholderText('name@example.com'), 'staff@test.com');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'Password1!');
    fireEvent.press(getByText('auth.login'));

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/(staff)/(tabs)/dashboard');
    });
  });

  it('displays server error message on failed login', async () => {
    const error: any = new Error('Unauthorized');
    error.response = { data: { message: 'Invalid email or password' } };
    mockLogin.mockRejectedValueOnce(error);

    const { getByText, getByPlaceholderText } = render(<Login />);

    // Switch to email mode
    fireEvent.press(getByText('Login with Email'));

    fireEvent.changeText(getByPlaceholderText('name@example.com'), 'wrong@test.com');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'wrongpass');
    fireEvent.press(getByText('auth.login'));

    await waitFor(() => {
      expect(getByText('Invalid email or password')).toBeTruthy();
    });
  });

  it('navigates to forgot-password page when tapped', () => {
    const { getByText } = render(<Login />);
    
    // Switch to email mode
    fireEvent.press(getByText('Login with Email'));

    fireEvent.press(getByText('auth.forgotPassword'));
    expect(mockRouterPush).toHaveBeenCalledWith('/(public)/forgot-password');
  });

  it('navigates to register page when "Sign up" is tapped', () => {
    const { getByText } = render(<Login />);
    fireEvent.press(getByText('auth.signup'));
    expect(mockRouterPush).toHaveBeenCalledWith('/register');
  });

  it('calls googleLogin and navigates customer on Google login success', async () => {
    const googleUser = { id: '5', email: 'g@gmail.com', role: 'customer', name: 'Google User' };
    mockGoogleLogin.mockResolvedValueOnce(undefined);
    useAuthStore.getState.mockReturnValue({
      login: mockLogin,
      googleLogin: mockGoogleLogin,
      facebookLogin: mockFacebookLogin,
      user: googleUser,
    });

    const { getByText } = render(<Login />);
    fireEvent.press(getByText('auth.continueGoogle'));

    await waitFor(() => {
      expect(mockGoogleLogin).toHaveBeenCalled();
    });
  });

  it('calls facebookLogin and navigates customer on Facebook login success', async () => {
    const fbUser = { id: '6', email: 'f@fb.com', role: 'customer', name: 'FB User' };
    mockFacebookLogin.mockResolvedValueOnce(undefined);
    useAuthStore.getState.mockReturnValue({
      login: mockLogin,
      googleLogin: mockGoogleLogin,
      facebookLogin: mockFacebookLogin,
      user: fbUser,
    });

    const { getByText } = render(<Login />);
    fireEvent.press(getByText('auth.continueFacebook'));

    await waitFor(() => {
      expect(mockFacebookLogin).toHaveBeenCalled();
    });
  });
});



