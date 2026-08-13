"use client";

import React from "react";
import {
  IconCalendarEvent,
  IconClock,
  IconMapPin,
  IconChevronRight,
  IconPlus,
} from "@tabler/icons-react";
import { Match } from "@/types/types";
import { formatDate } from "@/utils/formatters";

interface UpcomingMatchBannerProps {
  match: Match | null;
  countdown: string;
  isLoading?: boolean;
  onNewMatch: () => void;
  onMatchClick: (match: Match) => void;
}

export default function UpcomingMatchBanner({
  match,
  countdown,
  isLoading = false,
  onNewMatch,
  onMatchClick,
}: UpcomingMatchBannerProps) {
  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-app-border bg-app-card p-5 animate-pulse">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2.5">
            <div className="h-4 w-32 rounded bg-app-border" />
            <div className="h-6 w-64 rounded bg-app-border" />
            <div className="h-4 w-48 rounded bg-app-border" />
          </div>
          <div className="h-12 w-36 rounded-xl bg-app-border" />
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-app-border bg-app-card p-5 transition hover:border-app-border-hover">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-yellow-500/20 bg-yellow-500/10 text-yellow-400">
              <IconCalendarEvent size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-app-text-primary">No upcoming matches scheduled</h3>
              <p className="text-xs text-app-text-secondary">
                Schedule your next badminton session to organize courts, players, and match rotations.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNewMatch}
            className="flex items-center gap-1.5 rounded-xl bg-app-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-app-primary-hover shrink-0"
          >
            <IconPlus size={15} />
            <span>Schedule a Match</span>
          </button>
        </div>
      </div>
    );
  }

  const courtCount = match.courtNumber || "4";
  const playersCount = match.players?.length || 0;

  // ponytail: hero banner styled with Golden Yuzu & Cedar tones
  return (
    <div
      onClick={() => onMatchClick(match)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-[#181511] via-[#211c15] to-[#15130f] p-5 shadow-lg transition-all duration-200 hover:border-yellow-500/60 hover:shadow-yellow-950/30 hover:shadow-xl"
    >
      {/* Subtle background glow effect */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-yellow-500/10 blur-3xl transition group-hover:bg-yellow-500/20" />
      <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-emerald-500/5 blur-3xl" />

      <div className="relative z-10 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        {/* Left: Badge, Title, Meta */}
        <div className="space-y-2.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Upcoming Match
            </span>

            <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-yellow-400">
              {courtCount} {Number(courtCount) === 1 ? "Court" : "Courts"}
            </span>

            <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-yellow-400">
              {playersCount} {playersCount === 1 ? "Player" : "Players"}
            </span>
          </div>

          <div>
            <h2 className="truncate text-lg sm:text-xl font-bold tracking-tight text-white transition group-hover:text-yellow-300">
              {match.title}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-300">
            <div className="flex items-center gap-1.5 text-gray-300">
              <IconCalendarEvent size={14} className="text-yellow-400 shrink-0" />
              <span>{formatDate(match.date)}</span>
            </div>

            <div className="flex items-center gap-1.5 text-gray-300">
              <IconClock size={14} className="text-emerald-400 shrink-0" />
              <span>{match.time}</span>
            </div>

            {match.location && (
              <div className="flex items-center gap-1.5 text-gray-300">
                <IconMapPin size={14} className="text-amber-400 shrink-0" />
                <span className="truncate max-w-[200px] sm:max-w-xs">{match.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Countdown Display + CTA Button */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:flex-col lg:items-end lg:justify-center shrink-0 pt-2 lg:pt-0 border-t border-app-border/40 lg:border-t-0">
          {countdown && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3.5 py-2 backdrop-blur">
              <div className="text-right">
                <span className="block text-[9px] font-extrabold uppercase tracking-wider text-emerald-400/80 leading-none">
                  Starting in
                </span>
                <span className="font-mono text-base sm:text-lg font-black text-emerald-400 leading-tight">
                  {countdown}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 rounded-xl bg-app-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition group-hover:bg-app-primary-hover group-hover:shadow-md">
            <span>View Match Details</span>
            <IconChevronRight size={14} className="transition group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
