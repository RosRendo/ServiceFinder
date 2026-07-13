import { useState, useCallback } from "react";
import { api } from "@/store/authStore";

export interface AvailabilitySlot {
  id: string;
  dayOfWeek?: number; // 0-6 for recurring
  specificDate?: string; // YYYY-MM-DD for overrides
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isAvailable: boolean;
}

export function useStaffAvailability() {
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Backend expects /api/staff/availability or similar endpoint
      const res = await api.get("/api/staff/availability");
      const data = res.data?.data ?? res.data ?? [];
      setAvailability(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateAvailability = async (slots: Partial<AvailabilitySlot>[]) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.put("/api/staff/availability", { slots });
      const data = res.data?.data ?? res.data ?? [];
      if (Array.isArray(data)) setAvailability(data);
      return { success: true };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    availability,
    isLoading,
    error,
    fetchAvailability,
    updateAvailability,
  };
}
