import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from '@/app/auth/login/page';

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

vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: () => vi.fn(),
  GoogleOAuthProvider: ({ children }: any) => <div>{children}</div>,
  GoogleLogin: () => <div>Google Login</div>,
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
    
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('submits standard credentials successfully', async () => {
    mockLoginFn.mockResolvedValueOnce({ success: true, user: { role: 'company_admin' } });
    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'test@company.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /ចូលគណនី|SIGN IN/i }));

    await waitFor(() => {
      expect(mockLoginFn).toHaveBeenCalledWith('test@company.com', 'password123');
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/company/dashboard');
    });
  });
});
