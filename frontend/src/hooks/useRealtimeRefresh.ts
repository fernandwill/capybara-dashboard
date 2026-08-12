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
 * `onChange(tables)` with the names of the tables that changed. This replaces
 * polling with push-based real-time refresh: any write (from this app, another
 * client, or the status-update cron) triggers a refresh within ~1s.
 *
 * Events are debounced (trailing edge) so bursts of row changes collapse into a
 * single `onChange` call carrying the deduplicated set of changed tables. The
 * subscription is created once per mount and always calls the latest `onChange`
 * callback via a ref, so callers don't need to memoize it.
 */
export function useRealtimeRefresh(onChange: (tables: string[]) => void) {
  const onChangeRef = useRef(onChange);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTablesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const pendingTables = pendingTablesRef.current;

    const scheduleRefresh = (table: string) => {
      pendingTables.add(table);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const tables = Array.from(pendingTables);
        pendingTables.clear();
        onChangeRef.current(tables);
      }, DEBOUNCE_MS);
    };

    const channel = supabase.channel("db-changes");

    for (const table of WATCHED_TABLES) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          scheduleRefresh(payload.table as string);
        }
      );
    }

    channel.subscribe();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      pendingTables.clear();
      void supabase.removeChannel(channel);
    };
  }, []);
}
