import { useState, useEffect } from "react";
import { Booking } from "@/types/booking.types";

interface UseBookingsOptions {
  autoFetch?: boolean;
  status?: string;
  companyId?: string;
  customerId?: string;
  staffId?: string;
  page?: number;
  limit?: number;
}

export function useBookings(options: UseBookingsOptions = {}) {
  const {
    autoFetch = true,
    status,
    companyId,
    customerId,
    staffId,
    page = 1,
    limit = 10,
  } = options;
  const [bookings, setBookings] = useState<Booking[]>([]);
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
      fetchBookings();
    }
  }, [page, status, companyId, customerId, staffId]);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required - please log in");
        return;
      }

      const params = new URLSearchParams();
      if (status) params.append("status", status);
      if (companyId) params.append("companyId", companyId);
      if (customerId) params.append("customerId", customerId);
      if (staffId) params.append("staffId", staffId);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookings?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          method: "GET",
          credentials: "include",
        },
      );

      if (response.ok) {
        const resData = await response.json();
        const payload = resData.data || resData;
        setBookings(payload.bookings || []);
        if (payload.pagination) setPagination(payload.pagination);
      } else if (response.status === 401 || response.status === 403) {
        setError("Session expired - please log in again");
      } else {
        setError("Failed to fetch bookings");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getBookingById = async (id: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return { success: false, error: "Authentication required" };
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        },
      );

      if (response.ok) {
        const resData = await response.json();
        const payload = resData.data || resData;
        return { success: true, booking: payload.booking || payload };
      } else if (response.status === 401 || response.status === 403) {
        return { success: false, error: "Authentication failed" };
      } else if (response.status === 500) {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: errorData.message || "Server error" };
      }
      return { success: false, error: "Booking not found" };
    } catch (err: any) {
      console.error("Error fetching booking:", err);
      return { success: false, error: err.message || "An error occurred" };
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async (bookingData: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return {
          success: false,
          error: "Authentication required - please log in",
        };
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookings`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(bookingData),
        },
      );

      if (response.ok) {
        const data = await response.json();
        fetchBookings();
        return { success: true, booking: data.data || data.booking };
      } else if (response.status === 401 || response.status === 403) {
        console.error("Authentication failed:", response.status);
        return {
          success: false,
          error: "Authentication failed - session expired",
        };
      } else if (response.status === 500) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Server error:", errorData);
        return {
          success: false,
          error: errorData.message || "Server error - please try again",
        };
      }

      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      console.error("Booking creation failed:", error);
      return {
        success: false,
        error: error.error || "Failed to create booking",
      };
    } catch (err: any) {
      console.error("Create booking error:", err);
      return {
        success: false,
        error: err.message || "Failed to create booking",
      };
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (id: string, status: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return { success: false, error: "Authentication required" };
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ status }),
        },
      );

      if (response.ok) {
        fetchBookings();
        return { success: true };
      } else if (response.status === 401 || response.status === 403) {
        return { success: false, error: "Authentication failed" };
      }
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || "Failed to update status",
      };
    } catch (err: any) {
      return { success: false, error: err.message || "An error occurred" };
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (id: string, reason: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return { success: false, error: "Authentication required" };
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ reason }),
        },
      );

      if (response.ok) {
        fetchBookings();
        return { success: true };
      } else if (response.status === 401 || response.status === 403) {
        return { success: false, error: "Authentication failed" };
      }
      return { success: false, error: "Failed to cancel booking" };
    } catch (err: any) {
      return { success: false, error: err.message || "An error occurred" };
    } finally {
      setLoading(false);
    }
  };

  // ✨ NEW FEATURES

  /**
   * Assign staff to a booking (Company Admin)
   */
  const assignStaff = async (bookingId: string, staffId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${bookingId}/assign-staff`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ staffId }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        fetchBookings();
        return { success: true, booking: data.booking };
      }
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "Failed to assign staff",
      };
    } catch (err) {
      return { success: false, error: "An error occurred" };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get staff's assigned bookings
   */
  const getMyAssignedBookings = async (statusFilter?: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/staff/assigned?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        },
      );

      if (response.ok) {
        const resData = await response.json();
        const payload = resData.data || resData;
        setBookings(payload.bookings || []);
        if (payload.pagination) setPagination(payload.pagination);
        return { success: true, bookings: payload.bookings || [] };
      }
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "Failed to fetch assigned bookings",
      };
    } catch (err) {
      return { success: false, error: "An error occurred" };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Start a job (Staff)
   */
  const startJob = async (bookingId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${bookingId}/start`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      if (response.ok) {
        const data = await response.json();
        fetchBookings();
        return { success: true, booking: data.booking };
      }
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "Failed to start job",
      };
    } catch (err) {
      return { success: false, error: "An error occurred" };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update job progress (Staff)
   */
  const updateProgress = async (
    bookingId: string,
    progressPercent: number,
    staffNotes?: string,
  ) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${bookingId}/progress`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ progressPercent, staffNotes }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        fetchBookings();
        return { success: true, booking: data.booking };
      }
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "Failed to update progress",
      };
    } catch (err) {
      return { success: false, error: "An error occurred" };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Complete a job (Staff)
   */
  const completeJob = async (bookingId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${bookingId}/complete`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      if (response.ok) {
        const data = await response.json();
        fetchBookings();
        return { success: true, booking: data.booking };
      }
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "Failed to complete job",
      };
    } catch (err) {
      return { success: false, error: "An error occurred" };
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
    createBooking,
    updateBookingStatus,
    cancelBooking,
    // New features
    assignStaff,
    getMyAssignedBookings,
    startJob,
    updateProgress,
    completeJob,
  };
}
