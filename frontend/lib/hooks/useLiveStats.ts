import { useState, useEffect } from "react";

export interface LiveStats {
  activePros: number;
  avgResponseTimeMin: number;
  bookingsToday: number;
  tickerItems: {
    user: string;
    action: string;
    location: string;
    time: string;
  }[];
}

export function useLiveStats() {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/platform/stats/live`);
        if (!response.ok) throw new Error("Failed to fetch live stats");
        const data = await response.json();
        setStats(data);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Optional: Refresh stats every minute
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, error };
}
