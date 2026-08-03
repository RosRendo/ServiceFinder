import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Generic API response type
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

/**
 * Options for useAPI hook
 */
export interface UseApiOptions {
  skip?: boolean;
  cache?: boolean;
  retry?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

/**
 * Return type for useAPI hook
 */
export interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for data fetching
 * @param endpoint - API endpoint to fetch
 * @param options - Configuration options
 * @returns { data, loading, error, refetch }
 * 
 * @example
 * const { data, loading, error } = useAPI('/api/companies/featured?limit=6');
 * if (loading) return <Skeleton />;
 * return <CompanyGrid companies={data} />;
 */
export function useAPI<T = any>(
  endpoint: string,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const { skip = false, cache = true, retry = 1, onSuccess, onError } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);

  const retryCount = useRef(0);
  const abortController = useRef<AbortController | null>(null);
  const cachedData = useRef<Map<string, any>>(new Map());

  const fetchData = useCallback(async () => {
    // Check cache first
    if (cache && cachedData.current.has(endpoint)) {
      setData(cachedData.current.get(endpoint));
      setLoading(false);
      return;
    }

    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort();
    }

    abortController.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        {
          signal: abortController.current.signal,
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 401) {
          throw new Error("Unauthorized - please login");
        }
        if (response.status === 404) {
          throw new Error("Not found");
        }
        if (response.status >= 500) {
          throw new Error("Server error");
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || "Request failed");
      }

      const result = await response.json();

      // Handle API error response
      if (result.success === false) {
        throw new Error(result.message || result.error || "API error");
      }

      // Normalize response structure
      const normalizedData = result.data ?? result;

      // Cache if enabled
      if (cache) {
        cachedData.current.set(endpoint, normalizedData);
      }

      setData(normalizedData);
      onSuccess?.(normalizedData);
    } catch (err: any) {
      const errorMessage = err.message || "Network error";

      // Ignore abort errors
      if (err.name === "AbortError") {
        return;
      }

      // Retry logic
      if (retryCount.current < retry) {
        retryCount.current++;
        setTimeout(fetchData, 1000 * retryCount.current);
        return;
      }

      setError(errorMessage);
      onError?.(errorMessage);

      if (process.env.NODE_ENV === "development") {
        console.error(`API Error [${endpoint}]:`, errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, skip, cache, retry, onSuccess, onError]);

  useEffect(() => {
    if (!skip) {
      fetchData();
    }

    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [endpoint, skip]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Hook for paginated API calls
 * @param endpoint - Base API endpoint
 * @param options - Configuration options
 * @returns { data, loading, error, hasMore, loadMore, refetch }
 * 
 * @example
 * const { data, loading, hasMore, loadMore } = usePaginatedAPI('/api/companies');
 * // Use IntersectionObserver to trigger loadMore when scrolling to bottom
 */
export function usePaginatedAPI<T = any>(
  endpoint: string,
  options: { limit?: number; skip?: boolean } = {}
) {
  const { limit = 12, skip = false } = options;

  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPage = useCallback(
    async (pageNum: number = 1, append = false) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.append("page", pageNum.toString());
        params.append("limit", limit.toString());

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}${endpoint}?${params}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch");
        }

        const result = await response.json();
        const newItems = result.data || result.companies || [];

        if (append) {
          setItems((prev) => [...prev, ...newItems]);
        } else {
          setItems(newItems);
        }

        setHasMore(newItems.length === limit);
        setPage(pageNum);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    },
    [endpoint, limit]
  );

  useEffect(() => {
    if (!skip) {
      fetchPage(1);
    }
  }, [endpoint]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchPage(page + 1, true);
    }
  }, [loading, hasMore, page, fetchPage]);

  return {
    data: items,
    loading,
    error,
    hasMore,
    page,
    loadMore,
    refetch: () => fetchPage(1),
  };
}

/**
 * Hook for mutations (POST, PUT, DELETE)
 * @returns { mutate, loading, error }
 * 
 * @example
 * const { mutate } = useMutation();
 * await mutate('/api/companies', { name: 'New Company' }, 'POST');
 */
export function useMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (
      endpoint: string,
      body?: any,
      method: "POST" | "PUT" | "DELETE" | "PATCH" = "POST"
    ) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
          {
            method,
            headers: {
              "Content-Type": "application/json",
            },
            body: body ? JSON.stringify(body) : undefined,
            credentials: "include",
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Request failed");
        }

        const result = await response.json();
        return result;
      } catch (err: any) {
        const errorMessage = err.message || "An error occurred";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { mutate, loading, error };
}
