import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from '@/app/auth/login/page';
import { useAuthContext } from '@/lib/contexts/AuthContext';

// Mock Next.js navigation and contexts
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    refresh: mockRefresh,
  }),
  useSearchParams: () => ({
    get: vi.fn(() => null),
  }),
}));

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
    button: ({ children, className, ...props }: any) => <button className={className} {...props}>{children}</button>,
    form: ({ children, className, ...props }: any) => <form className={className} {...props}>{children}</form>,
    h2: ({ children, className, ...props }: any) => <h2 className={className} {...props}>{children}</h2>,
    p: ({ children, className, ...props }: any) => <p className={className} {...props}>{children}</p>,
  },
}));

// Mock @react-oauth/google
vi.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onSuccess }: any) => (
    <button data-testid="google-login-btn" onClick={() => onSuccess({ credential: 'mock-google-token' })}>
      Continue with Google
    </button>
  ),
}));

// Mock toast hook
const mockToast = vi.fn();
vi.mock('@/lib/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock Auth Context
const mockLoginFn = vi.fn();
const mockGoogleLoginFn = vi.fn();
const mockFacebookLoginFn = vi.fn();
const mockVerify2FAFn = vi.fn();

vi.mock('@/lib/contexts/AuthContext', () => ({
  useAuthContext: () => ({
    login: mockLoginFn,
    googleLogin: mockGoogleLoginFn,
    facebookLogin: mockFacebookLoginFn,
    verify2FA: mockVerify2FAFn,
  }),
}));

describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form properly', () => {
    render(<Login />);
    
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByTestId('google-login-btn')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue with Facebook/i })).toBeInTheDocument();
  });

  it('submits standard credentials successfully', async () => {
    mockLoginFn.mockResolvedValueOnce({ success: true, user: { role: 'company_admin' } });
    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@company.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockLoginFn).toHaveBeenCalledWith('test@company.com', 'password123');
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/company/dashboard');
    });
  });

  it('handles Google login success callback correctly', async () => {
    mockGoogleLoginFn.mockResolvedValueOnce({ success: true, user: { role: 'admin' } });
    render(<Login />);

    fireEvent.click(screen.getByTestId('google-login-btn'));

    await waitFor(() => {
      expect(mockGoogleLoginFn).toHaveBeenCalledWith('mock-google-token');
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
    });
  });

  it('triggers Facebook login simulation successfully', async () => {
    mockFacebookLoginFn.mockResolvedValueOnce({ success: true, user: { role: 'staff' } });
    render(<Login />);

    fireEvent.click(screen.getByRole('button', { name: /Continue with Facebook/i }));

    await waitFor(() => {
      expect(mockFacebookLoginFn).toHaveBeenCalledWith(expect.stringContaining('mock_facebook_auth_token_'));
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/staff/dashboard');
    });
  });
});
