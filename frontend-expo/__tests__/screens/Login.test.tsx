/**
 * Login Screen — Component Tests
 * Tests rendering, input handling, form validation, and navigation.
 */

// ─── Mocks (must be before imports) ────────────────────────────────────────
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const mockRouterReplace = jest.fn();
const mockRouterPush = jest.fn();
const mockRouterBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
    push: mockRouterPush,
    back: mockRouterBack,
  }),
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
    return selector(state);
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

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

// ─── Imports ────────────────────────────────────────────────────────────────
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Login from '../../app/(public)/login';

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

  it('renders all expected UI elements', () => {
    const { getByText, getByPlaceholderText } = render(<Login />);

    expect(getByText('Welcome Back')).toBeTruthy();
    expect(getByText('Sign in to your account to continue')).toBeTruthy();
    expect(getByPlaceholderText('name@example.com')).toBeTruthy();
    expect(getByPlaceholderText('••••••••')).toBeTruthy();
    expect(getByText('Log In')).toBeTruthy();
    expect(getByText('Continue with Google')).toBeTruthy();
    expect(getByText('Continue with Facebook')).toBeTruthy();
    expect(getByText("Don't have an account?")).toBeTruthy();
  });

  it('shows validation error when submitting with empty fields', async () => {
    const { getByText } = render(<Login />);

    fireEvent.press(getByText('Log In'));

    await waitFor(() => {
      expect(getByText('Please enter both email and password')).toBeTruthy();
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('shows validation error when only email is filled', async () => {
    const { getByText, getByPlaceholderText } = render(<Login />);

    fireEvent.changeText(getByPlaceholderText('name@example.com'), 'user@test.com');
    fireEvent.press(getByText('Log In'));

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

    fireEvent.changeText(getByPlaceholderText('name@example.com'), 'c@test.com');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'Password1!');
    fireEvent.press(getByText('Log In'));

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
    fireEvent.changeText(getByPlaceholderText('name@example.com'), 'biz@test.com');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'Password1!');
    fireEvent.press(getByText('Log In'));

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
    fireEvent.changeText(getByPlaceholderText('name@example.com'), 'staff@test.com');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'Password1!');
    fireEvent.press(getByText('Log In'));

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/(staff)/(tabs)/dashboard');
    });
  });

  it('displays server error message on failed login', async () => {
    const error: any = new Error('Unauthorized');
    error.response = { data: { message: 'Invalid email or password' } };
    mockLogin.mockRejectedValueOnce(error);

    const { getByText, getByPlaceholderText } = render(<Login />);

    fireEvent.changeText(getByPlaceholderText('name@example.com'), 'wrong@test.com');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'wrongpass');
    fireEvent.press(getByText('Log In'));

    await waitFor(() => {
      expect(getByText('Invalid email or password')).toBeTruthy();
    });
  });

  it('navigates to forgot-password page when tapped', () => {
    const { getByText } = render(<Login />);
    fireEvent.press(getByText('Forgot Password?'));
    expect(mockRouterPush).toHaveBeenCalledWith('/(public)/forgot-password');
  });

  it('navigates to register page when "Sign up" is tapped', () => {
    const { getByText } = render(<Login />);
    fireEvent.press(getByText('Sign up'));
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
    fireEvent.press(getByText('Continue with Google'));

    await waitFor(() => {
      expect(mockGoogleLogin).toHaveBeenCalled();
      expect(mockRouterReplace).toHaveBeenCalledWith('/(customer)/(tabs)/home');
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
    fireEvent.press(getByText('Continue with Facebook'));

    await waitFor(() => {
      expect(mockFacebookLogin).toHaveBeenCalled();
      expect(mockRouterReplace).toHaveBeenCalledWith('/(customer)/(tabs)/home');
    });
  });
});
