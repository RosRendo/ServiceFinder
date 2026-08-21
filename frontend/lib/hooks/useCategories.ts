// hooks/useCategories.ts
import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { ServiceType } from '@/types/serviceType.types';
import { Category } from '@/types/category.types';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';


interface CategoryWithTypes extends Category {
  serviceTypes: ServiceType[];
}

interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseCategoryReturn {
  category: CategoryWithTypes | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch all categories
 * @returns {UseCategoriesReturn}
 */
export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/categories');
      const data = response.data;

      // Handle both plain array and wrapped { success, data } shapes
      const resolvedData = data.data?.data || data.data || data;
      
      if (Array.isArray(resolvedData)) {
        setCategories(resolvedData);
      } else {
        throw new Error(data.message || 'Failed to fetch categories');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories
  };
}

/**
 * Hook to fetch a single category by slug with its service types
 * @param {string} slug - Category slug
 * @returns {UseCategoryReturn}
 */
export function useCategory(slug: string): UseCategoryReturn {
  const [category, setCategory] = useState<CategoryWithTypes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategory = async () => {
    if (!slug) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${slug}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Category not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setCategory(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch category');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching category:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategory();
  }, [slug]);

  return {
    category,
    loading,
    error,
    refetch: fetchCategory
  };
}

/**
 * Hook to create a new category (Admin only)
 * @returns {Object} - { createCategory, loading, error }
 */
export function useCreateCategory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCategory = async (categoryData: {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    imageUrl?: string;
    displayOrder?: number;
  }, token: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create category');
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
    createCategory,
    loading,
    error
  };
}

/**
 * Hook to update a category (Admin only)
 * @returns {Object} - { updateCategory, loading, error }
 */
export function useUpdateCategory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateCategory = async (
    id: string,
    updates: Partial<{
      name: string;
      slug: string;
      description: string;
      icon: string;
      imageUrl: string;
      displayOrder: number;
      status: string;
    }>,
    token: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update category');
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
    updateCategory,
    loading,
    error
  };
}

/**
 * Hook to delete a category (Admin only)
 * @returns {Object} - { deleteCategory, loading, error }
 */
export function useDeleteCategory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteCategory = async (id: string, token: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'DELETE',
        headers: {
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete category');
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
    deleteCategory,
    loading,
    error
  };
}