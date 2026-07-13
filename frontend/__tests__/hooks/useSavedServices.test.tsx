import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSavedServices, useIsServiceSaved } from '@/lib/hooks/useSavedServices';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useSavedServices Hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    // localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'mock-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
    
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
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/customers/saved-services'),
      expect.objectContaining({
        headers: { Authorization: 'Bearer mock-token' }
      })
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
