import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSavedServices, useIsServiceSaved } from '@/lib/hooks/useSavedServices';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// The hook builds its URL from NEXT_PUBLIC_API_URL; pin it so assertions
// don't depend on the host environment.
const API_URL = 'http://test-api';
process.env.NEXT_PUBLIC_API_URL = API_URL;

describe('useSavedServices Hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Turn off retries for testing
        },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('fetches saved services successfully', async () => {
    const mockServices = [
      { id: '1', serviceId: 'srv-1', service: { title: 'Plumbing Repair' } }
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockServices })
    });

    const { result } = renderHook(() => useSavedServices(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockServices);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    // Auth is cookie-based (httpOnly session cookie) since f4b2454 — no
    // Authorization header is sent; credentials are included by the caller
    // environment. Assert the URL contract instead.
    expect(mockFetch).toHaveBeenCalledWith(
      `${API_URL}/api/customers/saved-services`,
      expect.objectContaining({})
    );
  });

  it('handles fetch errors correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401
    });

    const { result } = renderHook(() => useSavedServices(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Failed to fetch saved services');
  });
});
