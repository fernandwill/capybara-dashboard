// Shared hook for fetching the enriched player list.
//
// Backed by SWR: the "/api/players" key is cached globally and deduped across
// the dashboard (insights) and the players page, so navigating between them
// reuses the loaded list. Realtime revalidates it when a player or their
// match participation changes.

import { useCallback } from "react";
import useSWR from "swr";
import type { PlayerRecord } from "@/components/players/EditPlayerModal";

export function usePlayers() {
    const {
        data: players = [],
        isLoading,
        error,
        mutate,
    } = useSWR<PlayerRecord[]>("/api/players");

    const fetchPlayers = useCallback(async () => {
        await mutate();
    }, [mutate]);

    return {
        players,
        isLoading,
        error: error ? "Failed to fetch players" : null,
        fetchPlayers,
    };
}
