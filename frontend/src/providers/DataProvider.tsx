"use client";

import { SWRConfig, useSWRConfig } from "swr";
import type { ReactNode } from "react";
import { authFetch } from "@/lib/authFetch";
import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";

// Every cache key is fetched through authFetch (adds the Supabase token).
const fetcher = async (url: string) => {
  const response = await authFetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Table -> SWR cache keys affected by a change on that table. The realtime
// payload tells us which tables actually changed, so a burst only revalidates
// the keys that need it instead of refetching everything.
const TABLE_KEYS: Record<string, string[]> = {
  matches: ["/api/matches", "/api/stats", "/api/stats/monthly"],
  players: ["/api/players"],
  match_players: ["/api/matches", "/api/players"],
  payments: ["/api/matches"],
};

/**
 * Single app-wide realtime subscription. Any row change in a watched table
 * revalidates the affected SWR keys, so every mounted page reconciles without
 * its own polling or per-page subscriptions. Unmounted keys are prefetched
 * into the shared cache, making navigation back to them instant.
 */
function RealtimeSync() {
  const { mutate } = useSWRConfig();

  useRealtimeRefresh((tables) => {
    const keys = new Set<string>();
    for (const table of tables) {
      for (const key of TABLE_KEYS[table] ?? []) {
        keys.add(key);
      }
    }
    for (const key of keys) {
      void mutate(key);
    }

    // Match-detail pages key on `/api/matches/:id`. Any change to a match,
    // its roster (match_players), or its payments can affect the open detail
    // page (status, play counts, round history), so revalidate those keys too.
    if (tables.some((t) => t === "matches" || t === "match_players" || t === "payments")) {
      void mutate(
        (key) =>
          typeof key === "string" &&
          key.startsWith("/api/matches/") &&
          key !== "/api/matches"
      );
    }
  });

  return null;
}

/**
 * Global data layer. SWR provides a shared cache + request deduping so
 * navigating between pages reuses already-loaded data, and concurrent
 * requests for the same key (e.g. an onSuccess refetch racing the realtime
 * revalidation) collapse into a single fetch.
 */
export function DataProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        // Realtime is the freshness source; refetching on window focus would
        // only add churn.
        revalidateOnFocus: false,
        // Collapse concurrent same-key fetches (realtime + optimistic
        // onSuccess) into one request within this window.
        dedupingInterval: 2000,
        // Keep rendering the previous data while a background revalidation is
        // in flight so the UI never flashes a loading state.
        keepPreviousData: true,
        // Single attempt per revalidation; the realtime loop retries.
        shouldRetryOnError: false,
      }}
    >
      <RealtimeSync />
      {children}
    </SWRConfig>
  );
}
