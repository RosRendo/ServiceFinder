import { useState, useEffect } from "react";
import { Booking } from "@/types/booking.types";
import apiClient from "@/lib/api/client";

// 🔹 Types
interface AvailabilitySlot {
  id: string | number;
  companyId: string | number;
  staffId: string | number;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface UseStaffAvailabilityOptions {
  autoFetch?: boolean;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface UseStaffBookingsOptions {
  autoFetch?: boolean;
  status?: string;
  page?: number;
  limit?: number;
}

interface ServiceRequest {
  id: string | number;
  status: string;
  // extend with more fields as needed from backend
  [key: string]: any;
}

interface UseStaffServiceRequestsOptions {
  autoFetch?: boolean;
}

// 1️⃣ Staff Availability Hook
export function useStaffAvailability(options: UseStaffAvailabilityOptions = {}) {
  const { autoFetch = true } = options;

  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoFetch) {
      fetchAvailability();
    }
     
  }, [autoFetch]);

  const fetchAvailability = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/staff/availability/me`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        setError("Failed to fetch availability");
        return;
      }

      const data = await response.json();
      setAvailability(data.availability || []);
    } catch (err) {
      setError("An error occurred while fetching availability");
    } finally {
      setLoading(false);
    }
  };

  const createAvailability = async (payload: {
    date: string;
    startTime: string;
    endTime: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/staff/availability`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errData.error || "Failed to create availability",
        };
      }

      await fetchAvailability();
      return { success: true };
    } catch (err) {
      return { success: false, error: "An error occurred" };
    } finally {
      setLoading(false);
    }
  };

  const updateAvailability = async (
    id: string | number,
    payload: Partial<{ date: string; startTime: string; endTime: string }>
  ) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/staff/availability/${id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errData.error || "Failed to update availability",
        };
      }

      await fetchAvailability();
      return { success: true };
    } catch (err) {
      return { success: false, error: "An error occurred" };
    } finally {
      setLoading(false);
    }
  };

  const deleteAvailability = async (id: string | number) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/staff/availability/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errData.error || "Failed to delete availability",
        };
      }

      await fetchAvailability();
      return { success: true };
    } catch (err) {
      return { success: false, error: "An error occurred" };
    } finally {
      setLoading(false);
    }
  };

  return {
    availability,
    loading,
    error,
    fetchAvailability,
    createAvailability,
    updateAvailability,
    deleteAvailability,
  };
}

// 2️⃣ Staff Bookings Hook
export function useStaffBookings(options: UseStaffBookingsOptions = {}) {
  const { autoFetch = true, status, page = 1, limit = 10 } = options;

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });

  useEffect(() => {
    if (autoFetch) {
      fetchBookings();
    }
     
  }, [status, page, limit, autoFetch]);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: any = { page, limit };
      if (status) params.status = status;

      const response = await apiClient.get('/bookings/my-assignments', { params });
      const data = response.data?.data || response.data;
      
      setBookings(data.bookings || data.data?.bookings || data.data || data || []);
      setPagination(data.pagination || response.data?.pagination || pagination);
    } catch (err: any) {
      console.error(err);
      setError("An error occurred while fetching bookings");
    } finally {
      setLoading(false);
    }
  };

  const getBookingById = async (id: string) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/bookings/${id}`);
      const data = response.data?.data || response.data;
      const booking = data?.booking || data || null;
      return { success: true, booking };
    } catch (err) {
      return { success: false, error: "An error occurred" };
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (id: string, newStatus: string) => {
    setLoading(true);
    try {
      let endpoint = `/bookings/${id}/status`; // fallback
      
      if (newStatus === "in_progress" || newStatus === "in-progress") {
        endpoint = `/bookings/${id}/start`;
      } else if (newStatus === "completed") {
        endpoint = `/bookings/${id}/complete`;
      }

      const response = await apiClient.patch(endpoint, { status: newStatus });
      await fetchBookings();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.message || "An error occurred" };
    } finally {
      setLoading(false);
    }
  };

  return {
    bookings,
    loading,
    error,
    pagination,
    fetchBookings,
    getBookingById,
    updateBookingStatus,
  };
}

// 3️⃣ Staff Service Requests Hook (Pending Services)
export function useStaffServiceRequests(
  options: UseStaffServiceRequestsOptions = {}
) {
  const { autoFetch = true } = options;

  const [pendingServices, setPendingServices] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoFetch) {
      fetchPendingServices();
    }
     
  }, [autoFetch]);

  const fetchPendingServices = async () => {
    setLoading(true);
    setError(null);

    try {
      // NOTE: Replace this endpoint if/when a pending service requests route is added for staff in NestJS
      // const response = await apiClient.get('/services/pending');
      // const data = response.data?.data || response.data;
      setPendingServices([]);
    } catch (err: any) {
      setError("An error occurred while fetching pending services");
    } finally {
      setLoading(false);
    }
  };

  const approveService = async (id: string | number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/staff/services/${id}/approve`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errData.error || "Failed to approve service",
        };
      }

      await fetchPendingServices();
      return { success: true };
    } catch (err) {
      return { success: false, error: "An error occurred" };
    } finally {
      setLoading(false);
    }
  };

  const rejectService = async (id: string | number, reason?: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/staff/services/${id}/reject`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ reason }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errData.error || "Failed to reject service",
        };
      }

      await fetchPendingServices();
      return { success: true };
    } catch (err) {
      return { success: false, error: "An error occurred" };
    } finally {
      setLoading(false);
    }
  };

  return {
    pendingServices,
    loading,
    error,
    fetchPendingServices,
    approveService,
    rejectService,
  };
}

// 4️⃣ Staff profile / me (stats, recent reviews for profile page)
export interface StaffMeStats {
  completedBookingsCount: number;
  totalEarnings: number;
  monthlyEarnings?: number;
}

export interface StaffReview {
  id: string;
  companyRating?: number;
  staffRating?: number;
  companyComment?: string | null;
  staffComment?: string | null;
  createdAt: string;
  customer?: { fullName: string };
}

export function useStaffMe(options: { autoFetch?: boolean } = {}) {
  const { autoFetch = true } = options;
  const [staff, setStaff] = useState<{
    id: string;
    userId: string;
    companyId: string;
    role: string;
    user: { id: string; fullName: string; email: string; phone: string | null; avatar: string | null };
    company: { id: string; name: string };
  } | null>(null);
  const [stats, setStats] = useState<StaffMeStats>({ completedBookingsCount: 0, totalEarnings: 0 });
  const [recentReviews, setRecentReviews] = useState<StaffReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMe = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/auth/me');
      const data = response.data?.data || response.data;
      
      setStaff(data.staff ?? null);
      setStats(data.stats ?? { completedBookingsCount: 0, totalEarnings: 0, monthlyEarnings: 0 });
      setRecentReviews(data.recentReviews ?? []);
    } catch {
      setError("Failed to load staff profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) fetchMe();
  }, [autoFetch]);

  return { staff, stats, recentReviews, loading, error, fetchMe };
}

/** Format ISO time string to "h:mm a" for display */
export function formatStaffTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const h = hours % 12 || 12;
    const m = minutes.toString().padStart(2, "0");
    return `${h}:${m} ${ampm}`;
  } catch {
    return isoString;
  }
}

/** Duration in minutes from two ISO time strings */
export function durationMinutes(startIso: string, endIso: string): number {
  try {
    return (new Date(endIso).getTime() - new Date(startIso).getTime()) / (1000 * 60);
  } catch {
    return 0;
  }
}

/** Format duration as "Xh Ym" or "X min" */
export function formatDuration(startIso: string, endIso: string): string {
  const min = durationMinutes(startIso, endIso);
  if (min <= 0) return "0 min";
  const hours = Math.floor(min / 60);
  const minutes = Math.round(min % 60);
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  return `${hours}h ${minutes}m`;
}

export interface UseRecommendedStaffOptions {
  limit?: number;
}

export function useRecommendedStaff(options: UseRecommendedStaffOptions = {}) {
  const { limit = 6 } = options;
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommended = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/staff/recommended?${params}`);
      if (response.ok) {
        const data = await response.json();
        setStaff(data.data || []);
      } else {
        setError('Failed to fetch recommended staff');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommended();
  }, [limit]);

  return { staff, loading, error, refetch: fetchRecommended };
}

