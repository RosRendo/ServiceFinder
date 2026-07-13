import { useState, useEffect } from "react";
import { Service } from "@/types/service.types";
import api from "@/lib/api/client";

interface UseServicesOptions {
  autoFetch?: boolean;
  companyId?: string;
  categoryId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export function useServices(options: UseServicesOptions = {}) {
  const {
    autoFetch = true,
    companyId,
    categoryId,
    isActive,
    page = 1,
    limit = 10,
  } = options;
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });

  useEffect(() => {
    if (autoFetch) {
      fetchServices();
    }
  }, [page, companyId, categoryId, isActive]);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (companyId) params.append("companyId", companyId);
      if (categoryId) params.append("categoryId", categoryId);
      if (isActive !== undefined)
        params.append("isActive", isActive.toString());
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await api.get(`/services?${params}`);
      const result = response.data;
      const resolved = result.data?.data || result.data || result;
      setServices(Array.isArray(resolved) ? resolved : (resolved.services || []));
      setPagination(
        result.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          pages: 0,
        },
      );
    } catch (err) {
      setError("An error occurred");
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const getServiceById = async (id: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/services/${id}`);
      return { success: true, service: response.data.data || response.data.service };
    } catch (err) {
      return { success: false, error: "An error occurred" };
    } finally {
      setLoading(false);
    }
  };

  const createService = async (serviceData: any) => {
    setLoading(true);
    try {
      const response = await api.post(`/services`, serviceData);
      fetchServices();
      return { success: true, service: response.data.service };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.message || "Failed to create service" };
    } finally {
      setLoading(false);
    }
  };

  const updateService = async (id: string, serviceData: any) => {
    setLoading(true);
    try {
      await api.put(`/services/${id}`, serviceData);
      fetchServices();
      return { success: true };
    } catch (err) {
      return { success: false, error: "An error occurred" };
    } finally {
      setLoading(false);
    }
  };

  const deleteService = async (id: string) => {
    setLoading(true);
    try {
      await api.delete(`/services/${id}`);
      fetchServices();
      return { success: true };
    } catch (err) {
      return { success: false, error: "An error occurred" };
    } finally {
      setLoading(false);
    }
  };

  const fetchServicesByCompany = async (companyId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/services/company/${companyId}`);
      const data = res.data;
      let servicesArray = [];
      if (Array.isArray(data)) {
        servicesArray = data;
      } else if (Array.isArray(data?.data)) {
        servicesArray = data.data;
      } else if (Array.isArray(data?.data?.data)) {
        servicesArray = data.data.data;
      } else if (Array.isArray(data?.data?.services)) {
        servicesArray = data.data.services;
      } else if (Array.isArray(data?.services)) {
        servicesArray = data.services;
      }
      setServices(servicesArray);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch services by company:", err);
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return {
    services,
    loading,
    error,
    pagination,
    fetchServices,
    getServiceById,
    createService,
    updateService,
    deleteService,
    fetchServicesByCompany,
  };
}

// Global search across all services with filters
interface UseServicesBySearchOptions {
  search?: string;
  category?: string;
  maxPrice?: number | null;
  serviceType?: string;
  page?: number;
  limit?: number;
}

export function useServicesBySearch(options: UseServicesBySearchOptions = {}) {
  const {
    search = "",
    category = "",
    maxPrice = null,
    serviceType = "",
    page = 1,
    limit = 12,
  } = options;

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    pages: 0,
  });

  useEffect(() => {
    fetchServices();
  }, [search, category, maxPrice, serviceType, page, limit]);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category) params.append("category", category);
      if (maxPrice !== null) params.append("maxPrice", maxPrice.toString());
      if (serviceType) params.append("serviceType", serviceType);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await api.get(`/services/search?${params}`);
      const result = response.data;
      const resolved = result.data?.data || result.data || result;
      setServices(Array.isArray(resolved) ? resolved : (resolved.services || []));
      setPagination(
        result.pagination || {
          total: 0,
          page: 1,
          limit: 12,
          pages: 0,
        },
      );
    } catch (err) {
      setError("An error occurred");
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    services,
    loading,
    error,
    pagination,
    refetch: fetchServices,
  };
}

export function useDeals(options: { autoFetch?: boolean; limit?: number } = {}) {
  const { autoFetch = true, limit = 6 } = options;
  const [deals, setDeals] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDeals = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/services/deals?limit=${limit}`);
      const result = response.data;
      const resolved = result.data?.data || result.data || result;
      setDeals(Array.isArray(resolved) ? resolved : (resolved.deals || []));
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) fetchDeals();
  }, [autoFetch, limit]);

  return { deals, loading, error, refetch: fetchDeals };
}
