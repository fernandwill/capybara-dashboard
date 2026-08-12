"use client";

import { useMemo } from "react";
import type { Match, Player } from "@/types/types";
import type { MonthlyPoint } from "@/hooks/useMonthlyStats";

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface DashboardInsightsInput {
  /** All completed matches (for day/hour analysis). */
  completedMatches: Match[];
  /** All matches in the selected year. */
  yearMatches: Match[];
  /** Monthly aggregate data for the selected year. */
  monthlyData: MonthlyPoint[];
  /** All players (for new-blood counting). */
  players: Player[];
  selectedYear: number;
}

/**
 * Derives the six "insights" cards on the dashboard: favourite badminton
 * centre, most-present players, new blood, strongest month, most active
 * weekday, and typical start hour — all scoped to the selected year.
 */
export function useDashboardInsights({
  completedMatches,
  yearMatches,
  monthlyData,
  players,
  selectedYear,
}: DashboardInsightsInput) {
  // 1. Favorite Badminton Centre (most frequent location in selectedYear)
  const favoriteCentre = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of yearMatches) {
      const loc = m.location?.trim();
      if (loc) {
        counts.set(loc, (counts.get(loc) || 0) + 1);
      }
    }
    if (counts.size === 0) return null;

    let bestName = "";
    let maxCount = 0;
    counts.forEach((count, loc) => {
      if (count > maxCount) {
        maxCount = count;
        bestName = loc;
      }
    });

    return maxCount > 0 ? { name: bestName, count: maxCount } : null;
  }, [yearMatches]);

  // 2. Most Presence (player(s) with highest match attendance in selectedYear)
  const mostPresence = useMemo(() => {
    const counts = new Map<
      string,
      { player: { id: string; name: string }; count: number }
    >();
    for (const m of yearMatches) {
      if (!m.players) continue;
      for (const mp of m.players) {
        if (!mp.player) continue;
        const p = mp.player;
        const current =
          counts.get(p.id) || { player: { id: p.id, name: p.name }, count: 0 };
        current.count += 1;
        counts.set(p.id, current);
      }
    }
    if (counts.size === 0) return null;

    let maxCount = 0;
    counts.forEach((item) => {
      if (item.count > maxCount) {
        maxCount = item.count;
      }
    });

    if (maxCount === 0) return null;

    const topPlayers: { id: string; name: string }[] = [];
    counts.forEach((item) => {
      if (item.count === maxCount) {
        topPlayers.push(item.player);
      }
    });

    return { players: topPlayers, count: maxCount };
  }, [yearMatches]);

  // 3. New Blood (number of new players who joined in selectedYear)
  const newBloodCount = useMemo(() => {
    return players.filter((p) => {
      if (!p.createdAt) return false;
      const createdDate = new Date(p.createdAt);
      return (
        !isNaN(createdDate.getTime()) &&
        createdDate.getFullYear() === selectedYear
      );
    }).length;
  }, [players, selectedYear]);

  // 4. Strongest Month (by hours in the selected year's monthly data)
  const strongestMonth = useMemo(() => {
    const sorted = [...monthlyData].sort((a, b) => b.hours - a.hours);
    return sorted[0] && sorted[0].hours > 0 ? sorted[0] : null;
  }, [monthlyData]);

  // 5. Most Active Day (weekday with the most completed matches in the year)
  const mostActiveDay = useMemo(() => {
    const counts = new Map<string, number>();
    for (const match of completedMatches) {
      const date = new Date(match.date);
      if (isNaN(date.getTime()) || date.getFullYear() !== selectedYear) continue;
      const name = WEEKDAY_NAMES[date.getDay()];
      counts.set(name, (counts.get(name) || 0) + 1);
    }

    let best: string | null = null;
    let bestCount = 0;
    counts.forEach((count, name) => {
      if (count > bestCount) {
        bestCount = count;
        best = name;
      }
    });
    return best;
  }, [completedMatches, selectedYear]);

  // 6. Typical Start Hour (most common match start hour in the year)
  const typicalStartHour = useMemo(() => {
    const counts = new Map<number, number>();
    for (const match of completedMatches) {
      const d = new Date(match.date);
      if (isNaN(d.getTime()) || d.getFullYear() !== selectedYear) continue;
      const start = match.time.split("-")[0].trim();
      const hour = parseInt(start.split(":")[0], 10);
      if (!isNaN(hour)) {
        counts.set(hour, (counts.get(hour) || 0) + 1);
      }
    }

    let best: number | null = null;
    let bestCount = 0;
    counts.forEach((count, hour) => {
      if (count > bestCount) {
        bestCount = count;
        best = hour;
      }
    });
    return best;
  }, [completedMatches, selectedYear]);

  return {
    favoriteCentre,
    mostPresence,
    newBloodCount,
    strongestMonth,
    mostActiveDay,
    typicalStartHour,
  };
}
