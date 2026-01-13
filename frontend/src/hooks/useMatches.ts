// Custom hook for fetching and managing match data

import { useState, useCallback } from "react";
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
}

interface UseMatchesReturn {
    matches: Match[];
    isLoading: boolean;
    error: string | null;
    fetchMatches: () => Promise<void>;
    autoUpdateMatches: () => Promise<void>;
    createMatch: (data: MatchFormData) => Promise<boolean>;
    updateMatch: (id: string, data: MatchFormData) => Promise<boolean>;
    deleteMatch: (id: string) => Promise<boolean>;
}

export function useMatches(): UseMatchesReturn {
    const [matches, setMatches] = useState<Match[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMatches = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await authFetch("/api/matches");
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setMatches(data);
        } catch (err) {
            console.error("Error fetching matches:", err);
            setError("Failed to fetch matches");
            setMatches([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const autoUpdateMatches = useCallback(async () => {
        try {
            const response = await authFetch("/api/matches/auto-update", {
                method: "POST",
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Silently refresh after auto-update
            await fetchMatches();
        } catch (err) {
            console.error("Error auto-updating matches:", err);
        }
    }, [fetchMatches]);

    const createMatch = useCallback(async (data: MatchFormData): Promise<boolean> => {
        try {
            const response = await authFetch("/api/matches", {
                method: "POST",
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await fetchMatches();
            return true;
        } catch (err) {
            console.error("Error creating match:", err);
            return false;
        }
    }, [fetchMatches]);

    const updateMatch = useCallback(async (id: string, data: MatchFormData): Promise<boolean> => {
        try {
            const response = await authFetch(`/api/matches/${id}`, {
                method: "PUT",
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await fetchMatches();
            return true;
        } catch (err) {
            console.error("Error updating match:", err);
            return false;
        }
    }, [fetchMatches]);

    const deleteMatch = useCallback(async (id: string): Promise<boolean> => {
        try {
            const response = await authFetch(`/api/matches/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Optimistically remove from local state
            setMatches((prev) => prev.filter((match) => match.id !== id));
            return true;
        } catch (err) {
            console.error("Error deleting match:", err);
            return false;
        }
    }, []);

    return {
        matches,
        isLoading,
        error,
        fetchMatches,
        autoUpdateMatches,
        createMatch,
        updateMatch,
        deleteMatch,
    };
}
