// Custom hook for fetching and managing stats data

import { useState, useCallback } from "react";
import { authFetch } from "@/lib/authFetch";
import { Stats } from "@/types/types";

const DEFAULT_STATS: Stats = {
    totalMatches: 0,
    upcomingMatches: 0,
    completedMatches: 0,
    hoursPlayed: "0.0",
};

export function useStats() {
    const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await authFetch("/api/stats");
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setStats(data);
        } catch (err) {
            console.error("Error fetching stats:", err);
            setError("Failed to fetch stats");
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        stats,
        isLoading,
        error,
        fetchStats,
    };
}
