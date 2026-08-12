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
            // Keep existing data on transient failures so the UI never blanks
            // out from a single flaky background refetch. Realtime retries.
        } finally {
            setIsLoading(false);
        }
    }, []);

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
            // instantly; the realtime refetch reconciles any drift.
            const match: Match = await response.json();
            setMatches((prev) => [match, ...prev]);
            return true;
        } catch (err) {
            console.error("Error creating match:", err);
            return false;
        }
    }, []);

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
            setMatches((prev) => prev.map((m) => (m.id === id ? match : m)));
            return true;
        } catch (err) {
            console.error("Error updating match:", err);
            return false;
        }
    }, []);

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
        createMatch,
        updateMatch,
        deleteMatch,
    };
}
