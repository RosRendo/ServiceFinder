import { useState, useEffect } from 'react';
import apiClient from '../api/client';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ServiceType {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  imageUrl: string;
  gradient: string;
  status: string;
  displayOrder: number;
  companiesCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ServiceTypeWithCategory extends ServiceType {
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

interface UseServiceTypesByCategoryReturn {
  serviceTypes: ServiceType[];
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string;
  } | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseServiceTypeReturn {
  serviceType: ServiceTypeWithCategory | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch service types by category slug
 * @param {string} categorySlug - Category slug
 * @returns {UseServiceTypesByCategoryReturn}
 */
export function useServiceTypesByCategory(categorySlug: string): UseServiceTypesByCategoryReturn {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [category, setCategory] = useState<{
    id: string;
    name: string;
    slug: string;
    icon: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServiceTypes = async () => {
    if (!categorySlug) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/service-types/category/${categorySlug}`);
      const data = response.data;

      // Peel the TransformInterceptor double-wrap:
      // API returns { data: { category, serviceTypes } }
      // Interceptor wraps to { success, data: { data: { category, serviceTypes } } }
      // axios response.data is the interceptor envelope
      const inner = data.data?.data || data.data || data;

      if (Array.isArray(inner)) {
        // Plain array
        setServiceTypes(inner);
        setCategory(null);
      } else if (inner?.serviceTypes) {
        // { category, serviceTypes } shape
        setServiceTypes(Array.isArray(inner.serviceTypes) ? inner.serviceTypes : []);
        setCategory(inner.category || null);
      } else if (inner?.data?.serviceTypes) {
        // Triple-wrapped edge case
        setServiceTypes(Array.isArray(inner.data.serviceTypes) ? inner.data.serviceTypes : []);
        setCategory(inner.data.category || null);
      } else {
        // Unknown shape — set empty arrays rather than throwing
        console.warn('Unexpected service types response shape:', data);
        setServiceTypes([]);
        setCategory(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching service types:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceTypes();
  }, [categorySlug]);

  return {
    serviceTypes,
    category,
    loading,
    error,
    refetch: fetchServiceTypes
  };
}

/**
 * Hook to fetch a single service type by slug
 * @param {string} slug - Service type slug
 * @returns {UseServiceTypeReturn}
 */
export function useServiceType(slug: string): UseServiceTypeReturn {
  const [serviceType, setServiceType] = useState<ServiceTypeWithCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServiceType = async () => {
    if (!slug) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/service-types/${slug}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Service type not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setServiceType(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch service type');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching service type:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceType();
  }, [slug]);

  return {
    serviceType,
    loading,
    error,
    refetch: fetchServiceType
  };
}

/**
 * Hook to create a new service type (Admin only)
 * @returns {Object} - { createServiceType, loading, error }
 */
export function useCreateServiceType() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createServiceType = async (
    serviceTypeData: {
      categoryId: string;
      name: string;
      slug: string;
      description?: string;
      icon?: string;
      image?: string;
      gradient?: string;
      displayOrder?: number;
    },
    token: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/service-types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceTypeData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create service type');
      }

      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createServiceType,
    loading,
    error
  };
}

/**
 * Hook to update a service type (Admin only)
 * @returns {Object} - { updateServiceType, loading, error }
 */
export function useUpdateServiceType() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateServiceType = async (
    id: string,
    updates: Partial<{
      categoryId: string;
      name: string;
      slug: string;
      description: string;
      icon: string;
      image: string;
      gradient: string;
      displayOrder: number;
      status: string;
    }>,
    token: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/service-types/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update service type');
      }

      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateServiceType,
    loading,
    error
  };
}

/**
 * Hook to delete a service type (Admin only)
 * @returns {Object} - { deleteServiceType, loading, error }
 */
export function useDeleteServiceType() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteServiceType = async (id: string, token: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/service-types/${id}`, {
        method: 'DELETE',
        headers: {
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete service type');
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    deleteServiceType,
    loading,
    error
  };
}