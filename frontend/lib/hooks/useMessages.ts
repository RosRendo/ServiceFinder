import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api/client";
import { useAuthContext } from "../contexts/AuthContext";

export function useMessages() {
  const { user } = useAuthContext();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get("/conversations/unread");
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (err) {
      console.error("Failed to load unread messages count", err);
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
    // Poll every 30 seconds for new messages
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    refetch: fetchUnreadCount,
  };
}
