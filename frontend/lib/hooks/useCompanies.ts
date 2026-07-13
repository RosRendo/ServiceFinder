import { useState, useEffect, useCallback } from "react";
import { Company } from "@/types/company.types";
import { Category } from "@/types/category.types";
import { ServiceType } from "@/types/serviceType.types";

interface UseFeaturedCompaniesOptions {
  limit?: number;
  sortBy?: "rating" | "reviews" | "newest";
}

interface UseTrendingServicesOptions {
  limit?: number;
  days?: number;
}

interface UseNearbyCompaniesOptions {
  lat: number;
  lng: number;
  radius?: number;
  limit?: number;
}

export function useFeaturedCompanies(
  options: UseFeaturedCompaniesOptions = {},
) {
  const { limit = 6, sortBy = "rating" } = options;
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeatured = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("limit", limit.toString());
      params.append("sortBy", sortBy);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/companies/featured?${params}`,
      );
      if (response.ok) {
        const data = await response.json();
        const resolvedData = data.data?.data || data.data || data;
        const items = Array.isArray(resolvedData) ? resolvedData : (resolvedData.companies || []);
        setCompanies(items);
      } else {
        setError("Failed to fetch featured companies");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatured();
  }, [limit, sortBy]);

  return { companies, loading, error, refetch: fetchFeatured };
}

export function useTrendingServices(options: UseTrendingServicesOptions = {}) {
  const { limit = 12, days = 7 } = options;
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrending = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("limit", limit.toString());
      params.append("days", days.toString());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/services/trending?${params}`,
      );
      if (response.ok) {
        const data = await response.json();
        const resolvedData = data.data?.data || data.data || data;
        setServices(Array.isArray(resolvedData) ? resolvedData : []);
      } else {
        setError("Failed to fetch trending services");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrending();
  }, [limit, days]);

  return { services, loading, error, refetch: fetchTrending };
}

export function useNearbyCompanies(options: UseNearbyCompaniesOptions) {
  const { lat, lng, radius = 5, limit = 12 } = options;
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNearby = async () => {
    if (!lat || !lng) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("lat", lat.toString());
      params.append("lng", lng.toString());
      params.append("radius", radius.toString());
      params.append("limit", limit.toString());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/companies/nearby?${params}`,
      );
      if (response.ok) {
        const data = await response.json();
        const resolvedData = data.data?.data || data.data || data;
        const items = Array.isArray(resolvedData) ? resolvedData : (resolvedData.companies || []);
        setCompanies(items);
      } else {
        setError("Failed to fetch nearby companies");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearby();
  }, [lat, lng, radius, limit]);

  return { companies, loading, error, refetch: fetchNearby };
}

export function useRecommendedCompanies(
  options: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 12 } = options;
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchRecommended = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/companies/recommended?${params}`,
      );
      if (response.ok) {
        const data = await response.json();
        const resolvedData = data.data?.data || data.data || data;
        const newCompanies = Array.isArray(resolvedData) ? resolvedData : (resolvedData.companies || []);
        if (page === 1) {
          setCompanies(newCompanies);
        } else {
          setCompanies((prev) => [...prev, ...newCompanies]);
        }
        setHasMore(newCompanies.length === limit);
      } else {
        setError("Failed to fetch recommended companies");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommended();
  }, [page, limit]);

  return { companies, loading, error, hasMore, refetch: fetchRecommended };
}

export function useNewCompanies(
  options: { limit?: number; days?: number } = {},
) {
  const { limit = 12, days = 30 } = options;
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNew = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("limit", limit.toString());
      params.append("days", days.toString());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/companies/new?${params}`,
      );
      if (response.ok) {
        const data = await response.json();
        const resolvedData = data.data?.data || data.data || data;
        const items = Array.isArray(resolvedData) ? resolvedData : (resolvedData.companies || []);
        setCompanies(items);
      } else {
        setError("Failed to fetch new companies");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNew();
  }, [limit, days]);

  return { companies, loading, error, refetch: fetchNew };
}

interface UseCompaniesOptions {
  autoFetch?: boolean;
  city?: string;
  status?: string;
  page?: number;
  limit?: number;
}

interface UseCompaniesByServiceTypeOptions {
  categorySlug: string;
  serviceTypeSlug: string;
  autoFetch?: boolean;
  search?: string;
  city?: string;
  minRating?: number;
  sortBy?: "rating" | "reviews" | "price_low" | "price_high";
  page?: number;
  limit?: number;
}

interface UseCompaniesByCategoryOptions {
  categorySlug: string;
  autoFetch?: boolean;
  search?: string;
  city?: string;
  minRating?: number;
  sortBy?: "rating" | "reviews" | "price_low" | "price_high";
  page?: number;
  limit?: number;
}

interface CompaniesByCategoryResponse {
  category: Category;
  companies: Company[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

interface CompaniesByServiceTypeResponse {
  category: Category;
  serviceType: ServiceType;
  companies: Company[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export function useCompanies(options: UseCompaniesOptions = {}) {
  const { autoFetch = true, city, status, page = 1, limit = 10 } = options;
  const [companies, setCompanies] = useState<Company[]>([]);
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
      fetchCompanies();
    }
  }, [page, city, status]);

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (city) params.append("city", city);
      if (status) params.append("status", status);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/companies?${params}`,
      );
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies);
        setPagination(data.pagination);
      } else {
        setError("Failed to fetch companies");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getCompanyById = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/companies/${id}`,
      );

      if (response.ok) {
        const data = await response.json();

        // Try both possible response structures
        const companyData = data.data || data.company;

        if (companyData) {
          return { success: true, company: companyData };
        } else {
          return { success: false, error: "Invalid response structure" };
        }
      }

      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || "Company not found",
      };
    } catch (err) {
      console.error("Company fetch error:", err); // Debug log
      return { success: false, error: "An error occurred" };
    } finally {
      setLoading(false);
    }
  };

  const getStaffMemberById = async (staffId: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/companies/staff/${staffId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        },
      );

      if (response.ok) {
        const data = await response.json();
        const staffData = data.data || data.staff || data;
        return { success: true, staff: staffData };
      }

      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || "Staff member not found",
      };
    } catch (err) {
      return { success: false, error: "An error occurred" };
    } finally {
      setLoading(false);
    }
  };

  const updateStaffMember = async (staffId: string, updates: any) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/companies/staff/${staffId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(updates),
        },
      );

      if (response.ok) {
        return { success: true };
      }

      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || "Failed to update staff member",
      };
    } catch (err) {
      return { success: false, error: "An error occurred" };
    }
  };

  const removeStaffMember = async (staffId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/companies/staff/${staffId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        },
      );

      if (response.ok) {
        return { success: true };
      }

      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || "Failed to remove staff member",
      };
    } catch (err) {
      return { success: false, error: "An error occurred" };
    }
  };

  const reactivateStaffMember = async (staffId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/companies/staff/${staffId}/reactivate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        },
      );

      if (response.ok) {
        return { success: true };
      }

      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || "Failed to reactivate staff member",
      };
    } catch (err) {
      return { success: false, error: "An error occurred" };
    }
  };

  return {
    companies,
    loading,
    error,
    pagination,
    fetchCompanies,
    getCompanyById,
    getStaffMemberById,
    updateStaffMember,
    removeStaffMember,
    reactivateStaffMember,
  };
}

/** Current user's company (company_admin). For dashboard and company-scoped data. */
export function useCompanyMe(options: { autoFetch?: boolean } = {}) {
  const { autoFetch = true } = options;
  const [company, setCompany] = useState<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    verificationStatus?: string;
    staffCount: number;
    servicesCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMe = async () => {
    setLoading(true);
    setError(null);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/companies/me`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        },
      );
      if (!response.ok) {
        setError("Failed to load company");
        return;
      }
      const data = await response.json();
      setCompany(data.company ?? null);
    } catch {
      setError("Failed to load company");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) fetchMe();
  }, [autoFetch]);

  return { company, loading, error, fetchMe };
}

export function useCompaniesByServiceType(
  options: UseCompaniesByServiceTypeOptions,
) {
  const {
    categorySlug,
    serviceTypeSlug,
    autoFetch = true,
    search,
    city,
    minRating,
    sortBy = "rating",
    page = 1,
    limit = 20,
  } = options;

  const [data, setData] = useState<CompaniesByServiceTypeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoFetch && categorySlug && serviceTypeSlug) {
      fetchCompanies();
    }
  }, [
    categorySlug,
    serviceTypeSlug,
    search,
    city,
    minRating,
    sortBy,
    page,
    limit,
  ]);

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (city) params.append("city", city);
      if (minRating) params.append("minRating", minRating.toString());
      if (sortBy) params.append("sortBy", sortBy);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/companies/categories/${categorySlug}/service-types/${serviceTypeSlug}?${params}`;
      const response = await fetch(url);

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Map API response to component-expected format
          const mappedData = {
            ...result.data,
            companies: result.data.companies.map((company: any) => ({
              ...company,
              // Map API fields to component fields
              verified: company.verificationStatus === "verified",
              location: company.city || company.address || company.location,
              reviews: company.reviewCount || 0,
              logoUrl: company.logoUrl,
              // Normalize coordinates from backend (which sends coordinates: { latitude, longitude })
              coordinates:
                company.coordinates &&
                company.coordinates.latitude != null &&
                company.coordinates.longitude != null
                  ? {
                      lat: company.coordinates.latitude,
                      lng: company.coordinates.longitude,
                    }
                  : undefined,
              // Ensure all optional fields exist
              highlights: company.highlights || [],
              responseTime:
                company.responseTime || "Usually responds within 24 hours",
            })),
          };
          setData(mappedData);
        } else {
          setError(result.message || "Failed to fetch companies");
        }
      } else {
        const result = await response.json();
        setError(result.message || "Failed to fetch companies");
      }
    } catch (err) {
      setError("An error occurred while fetching companies");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    category: data?.category || null,
    serviceType: data?.serviceType || null,
    companies: data?.companies || [],
    pagination: data?.pagination || { total: 0, page: 1, limit: 20, pages: 0 },
    loading,
    error,
    refetch: fetchCompanies,
  };
}

export function useCompaniesByCategory(options: UseCompaniesByCategoryOptions) {
  const {
    categorySlug,
    autoFetch = true,
    search,
    city,
    minRating,
    sortBy = "rating",
    page = 1,
    limit = 20,
  } = options;

  const [data, setData] = useState<CompaniesByCategoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoFetch && categorySlug) {
      fetchCompanies();
    }
  }, [categorySlug, search, city, minRating, sortBy, page, limit]);

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (city) params.append("city", city);
      if (minRating) params.append("minRating", minRating.toString());
      if (sortBy) params.append("sortBy", sortBy);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/companies/categories/${categorySlug}?${params}`;
      const response = await fetch(url);

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Map API response to component-expected format
          const mappedData = {
            ...result.data,
            companies: result.data.companies.map((company: any) => ({
              ...company,
              // Map API fields to component fields
              verified: company.verificationStatus === "verified",
              location: company.city || company.address || company.location,
              reviews: company.reviewCount || 0,
              logoUrl: company.logoUrl,
              // Normalize coordinates from backend (which sends coordinates: { latitude, longitude })
              coordinates:
                company.coordinates &&
                company.coordinates.latitude != null &&
                company.coordinates.longitude != null
                  ? {
                      lat: company.coordinates.latitude,
                      lng: company.coordinates.longitude,
                    }
                  : undefined,
              // Ensure all optional fields exist
              highlights: company.highlights || [],
              responseTime:
                company.responseTime || "Usually responds within 24 hours",
            })),
          };
          setData(mappedData);
        } else {
          setError(result.message || "Failed to fetch companies");
        }
      } else {
        const result = await response.json();
        setError(result.message || "Failed to fetch companies");
      }
    } catch (err) {
      setError("An error occurred while fetching companies");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    category: data?.category || null,
    companies: data?.companies || [],
    pagination: data?.pagination || { total: 0, page: 1, limit: 20, pages: 0 },
    loading,
    error,
    refetch: fetchCompanies,
  };
}

// Global search across all companies with advanced filters
interface UseCompaniesBySearchOptions {
  search?: string;
  category?: string;
  city?: string;
  minRating?: number | null;
  maxPrice?: number | null;
  verified?: boolean | null;
  page?: number;
  limit?: number;
}

export function useCompaniesBySearch(
  options: UseCompaniesBySearchOptions = {},
) {
  const {
    search = "",
    category = "",
    city = "",
    minRating = null,
    maxPrice = null,
    verified = null,
    page = 1,
    limit = 12,
  } = options;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    pages: 0,
  });

  useEffect(() => {
    fetchCompanies();
  }, [search, category, city, minRating, maxPrice, verified, page, limit]);

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category) params.append("category", category);
      if (city) params.append("city", city);
      if (minRating !== null) params.append("minRating", minRating.toString());
      if (maxPrice !== null) params.append("maxPrice", maxPrice.toString());
      if (verified !== null) params.append("verified", verified.toString());
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/companies/search?${params}`,
      );

      if (response.ok) {
        const result = await response.json();
        setCompanies(result.data || result.companies || []);
        setPagination(
          result.pagination || {
            total: 0,
            page: 1,
            limit: 12,
            pages: 0,
          },
        );
      } else {
        setError("Failed to fetch companies");
        setCompanies([]);
      }
    } catch (err) {
      setError("An error occurred");
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    companies,
    loading,
    error,
    pagination,
    refetch: fetchCompanies,
  };
}
