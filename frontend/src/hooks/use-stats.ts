// Custom hook for fetching and managing stats data.
//
// Backed by SWR: the "/api/stats" key is cached globally and deduped across
// pages, and revalidated by realtime whenever a match row changes.

import useSWR from "swr";
import { Stats } from "@/types/types";

const DEFAULT_STATS: Stats = {
    totalMatches: 0,
    upcomingMatches: 0,
    completedMatches: 0,
    hoursPlayed: "0.0",
};

export function useStats() {
    const {
        data = DEFAULT_STATS,
        isLoading,
        error,
    } = useSWR<Stats>("/api/stats");

    return {
        stats: data,
        isLoading,
        error: error ? "Failed to fetch stats" : null,
    };
}
