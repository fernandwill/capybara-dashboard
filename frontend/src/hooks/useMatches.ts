// Custom hook for fetching and managing match data.
//
// Backed by SWR: the "/api/matches" key is cached globally (via DataProvider)
// and deduped across pages, so navigating between the dashboard and the match
// history reuses already-loaded data instead of refetching.

import { useCallback } from "react";
import useSWR from "swr";
import { authFetch } from "@/lib/authFetch";
import { Match } from "@/types/types";

interface MatchFormData {
    title: string;
    location: string;
    courtNumber: string;
    date: string;
    time: string;
    fee: number;
    status: string;
    description?: string;
    playerIds?: string[];
}

interface UseMatchesReturn {
    matches: Match[];
    isLoading: boolean;
    error: string | null;
    fetchMatches: () => Promise<void>;
    createMatch: (data: MatchFormData) => Promise<boolean>;
    updateMatch: (id: string, data: MatchFormData) => Promise<boolean>;
    deleteMatch: (id: string) => Promise<boolean>;
}

export function useMatches(): UseMatchesReturn {
    const {
        data: matches = [],
        isLoading,
        error,
        mutate,
    } = useSWR<Match[]>("/api/matches");

    const fetchMatches = useCallback(async () => {
        await mutate();
    }, [mutate]);

    const createMatch = useCallback(async (data: MatchFormData): Promise<boolean> => {
        try {
            const response = await authFetch("/api/matches", {
                method: "POST",
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Optimistically prepend the created match so the UI updates
            // instantly; the realtime revalidation reconciles any drift.
            const match: Match = await response.json();
            await mutate((current: Match[] = []) => [match, ...current], {
                revalidate: false,
            });
            return true;
        } catch (err) {
            console.error("Error creating match:", err);
            return false;
        }
    }, [mutate]);

    const updateMatch = useCallback(async (id: string, data: MatchFormData): Promise<boolean> => {
        try {
            const response = await authFetch(`/api/matches/${id}`, {
                method: "PUT",
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Optimistically replace the match in place; realtime reconciles.
            const match: Match = await response.json();
            await mutate((current: Match[] = []) =>
                current.map((m) => (m.id === id ? match : m)),
                { revalidate: false }
            );
            return true;
        } catch (err) {
            console.error("Error updating match:", err);
            return false;
        }
    }, [mutate]);

    const deleteMatch = useCallback(async (id: string): Promise<boolean> => {
        try {
            const response = await authFetch(`/api/matches/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Optimistically remove from the cache; realtime reconciles.
            await mutate(
                (current: Match[] = []) => current.filter((match) => match.id !== id),
                { revalidate: false }
            );
            return true;
        } catch (err) {
            console.error("Error deleting match:", err);
            return false;
        }
    }, [mutate]);

    return {
        matches,
        isLoading,
        error: error ? "Failed to fetch matches" : null,
        fetchMatches,
        createMatch,
        updateMatch,
        deleteMatch,
    };
}
