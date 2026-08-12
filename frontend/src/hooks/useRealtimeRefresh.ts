"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

const WATCHED_TABLES = ["matches", "players", "match_players", "payments"] as const;

/**
 * Subscribes to Supabase Postgres Changes for every watched table and invokes
 * `onChange` whenever a row is inserted, updated, or deleted. This replaces
 * polling with push-based real-time refresh: any write (from this app, another
 * client, or the status-update cron) triggers a refetch within ~1s.
 *
 * The subscription is created once per mount and always calls the latest
 * `onChange` callback via a ref, so callers don't need to memoize it.
 */
export function useRealtimeRefresh(onChange: () => void) {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const channel = supabase.channel("db-changes");

    for (const table of WATCHED_TABLES) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          onChangeRef.current();
        }
      );
    }

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);
}
