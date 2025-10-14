"use client";

import { useCallback, useEffect, useState } from "react";

import { Match, Stats } from "../types";

const INITIAL_STATS: Stats = {
  totalMatches: 0,
  upcomingMatches: 0,
  completedMatches: 0,
  hoursPlayed: "0.0",
};

type MatchPayload = {
  title: string;
  location: string;
  courtNumber: string;
  date: string;
  time: string;
  fee: number;
  status: string;
  description?: string;
};

type OperationResult = { success: true } | { success: false; error: string };

export const useDashboardData = () => {
  const [stats, setStats] = useState<Stats>(INITIAL_STATS);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/stats");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = (await response.json()) as Stats;
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  const fetchMatches = useCallback(async () => {
    try {
      const response = await fetch("/api/matches");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = (await response.json()) as Match[];
      setMatches(data);
    } catch (error) {
      console.error("Error fetching matches:", error);
      setMatches([]);
    }
  }, []);

  const autoUpdateMatches = useCallback(async () => {
    try {
      const response = await fetch("/api/matches/auto-update", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Auto-update result:", data);

      await Promise.all([fetchMatches(), fetchStats()]);
    } catch (error) {
      console.error("Error auto-updating matches:", error);
    }
  }, [fetchMatches, fetchStats]);

  useEffect(() => {
    fetchStats();
    fetchMatches();
    autoUpdateMatches();

    const intervalId = window.setInterval(() => {
      autoUpdateMatches();
    }, 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchStats, fetchMatches, autoUpdateMatches]);

  const submitMatch = useCallback(
    async (matchData: MatchPayload, editingMatchId?: string): Promise<OperationResult> => {
      try {
        const url = editingMatchId
          ? `/api/matches/${editingMatchId}`
          : "/api/matches";
        const method = editingMatchId ? "PUT" : "POST";

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(matchData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        await response.json();
        await Promise.all([fetchStats(), fetchMatches()]);

        return { success: true };
      } catch (error) {
        console.error(
          `Error ${editingMatchId ? "updating" : "creating"} match:`,
          error
        );
        const message =
          error instanceof Error
            ? error.message
            : "Failed to save match. Please try again.";
        return { success: false, error: message };
      }
    },
    [fetchMatches, fetchStats]
  );

  const deleteMatch = useCallback(
    async (matchId: string): Promise<OperationResult> => {
      setIsDeleting(true);
      try {
        const response = await fetch(`/api/matches/${matchId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        setMatches((prevMatches) =>
          prevMatches.filter((existingMatch) => existingMatch.id !== matchId)
        );

        await Promise.all([fetchMatches(), fetchStats()]);

        return { success: true };
      } catch (error) {
        console.error("Error deleting match:", error);
        const message =
          error instanceof Error
            ? error.message
            : "Failed to delete match. Please try again.";
        return { success: false, error: message };
      } finally {
        setIsDeleting(false);
      }
    },
    [fetchMatches, fetchStats]
  );

  return {
    stats,
    matches,
    fetchMatches,
    fetchStats,
    submitMatch,
    deleteMatch,
    isDeleting,
  };
};
