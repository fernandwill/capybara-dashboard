"use client";

import { useMemo } from "react";
import { IconCalendar, IconCalendarEvent, IconStar, IconUsers } from "@tabler/icons-react";
import type { PlayerRecord } from "./EditPlayerModal";

interface PlayerStatsCardsProps {
  players: PlayerRecord[];
  isLoading: boolean;
}

/** Formats an ISO date into a relative label like "Added 3 days ago". */
export function formatRelativeTime(isoString?: string): string {
  if (!isoString) return "Recently";
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Added today";
  if (diffDays === 1) return "Added yesterday";
  if (diffDays < 30) return `Added ${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `Added ${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
}

/** The four summary stat cards above the players table. */
export default function PlayerStatsCards({ players, isLoading }: PlayerStatsCardsProps) {
  const currentYear = new Date().getFullYear();

  const matchesThisYearCount = players.reduce(
    (sum, p) => sum + (p.thisYearMatches ?? 0),
    0
  );

  const mostPlayedPlayer = useMemo(() => {
    if (players.length === 0) return null;
    return [...players].sort(
      (a, b) => (b.totalMatches ?? 0) - (a.totalMatches ?? 0)
    )[0];
  }, [players]);

  const lastAddedPlayer = useMemo(() => {
    if (players.length === 0) return null;
    return [...players].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    })[0];
  }, [players]);

  const cards = [
    {
      label: "Total Players",
      sub: "All time players",
      icon: <IconUsers size={18} />,
      iconClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
      value: isLoading ? "-" : String(players.length),
    },
    {
      label: `Matches in ${currentYear}`,
      sub: "Total player appearances",
      icon: <IconCalendarEvent size={18} />,
      iconClass: "border-blue-500/20 bg-blue-500/10 text-blue-400",
      value: isLoading ? "-" : String(matchesThisYearCount),
    },
    {
      label: "Most Played",
      sub: mostPlayedPlayer
        ? `${mostPlayedPlayer.totalMatches ?? 0} matches`
        : "0 matches",
      icon: <IconStar size={18} />,
      iconClass: "border-purple-500/20 bg-purple-500/10 text-purple-400",
      value: isLoading
        ? "-"
        : mostPlayedPlayer
          ? mostPlayedPlayer.name
          : "None",
    },
    {
      label: "Last Added",
      sub: lastAddedPlayer
        ? formatRelativeTime(lastAddedPlayer.createdAt)
        : "No players yet",
      icon: <IconCalendar size={18} />,
      iconClass: "border-amber-500/20 bg-amber-500/10 text-amber-400",
      value: isLoading
        ? "-"
        : lastAddedPlayer
          ? lastAddedPlayer.name
          : "None",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-app-border bg-app-bg p-4">
          <div className="flex items-center justify-between">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl border ${card.iconClass}`}
            >
              {card.icon}
            </div>
            <span className="text-[11px] font-medium text-app-text-muted">
              {card.label}
            </span>
          </div>
          <div className="mt-3">
            <p className="truncate text-2xl font-bold tracking-tight text-app-text-primary">
              {card.value}
            </p>
            <p className="mt-0.5 text-xs text-app-text-muted">{card.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
