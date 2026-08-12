"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

const WATCHED_TABLES = ["matches", "players", "match_players", "payments"] as const;

// Trailing-edge debounce window. A single logical action (e.g. creating a match
// with many players) fans out into many row changes — 1 INSERT on `matches` plus
// one INSERT per `match_players` row — so we collapse that burst into a single
// refresh instead of firing one refetch per event.
const DEBOUNCE_MS = 500;

/**
 * Subscribes to Supabase Postgres Changes for every watched table and invokes
 * `onChange` whenever a row is inserted, updated, or deleted. This replaces
 * polling with push-based real-time refresh: any write (from this app, another
 * client, or the status-update cron) triggers a refetch within ~1s.
 *
 * Events are debounced (trailing edge) so bursts of row changes collapse into a
 * single `onChange` call. The subscription is created once per mount and always
 * calls the latest `onChange` callback via a ref, so callers don't need to
 * memoize it.
 */
export function useRealtimeRefresh(onChange: () => void) {
  const onChangeRef = useRef(onChange);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const scheduleRefresh = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        onChangeRef.current();
      }, DEBOUNCE_MS);
    };

    const channel = supabase.channel("db-changes");

    for (const table of WATCHED_TABLES) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        scheduleRefresh
      );
    }

    channel.subscribe();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      void supabase.removeChannel(channel);
    };
  }, []);
}
