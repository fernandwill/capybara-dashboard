"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Clock, History, MapPin, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Match } from "@/types/types";
import { formatDurationHours, formatShortDate } from "@/utils/formatters";

interface RecentMatchesCardProps {
  matches: Match[];
  totalCount: number;
  showAll?: boolean;
  isLoading: boolean;
  onToggleShowAll?: () => void;
  onMatchClick: (match: Match) => void;
  onOpenMenu: (event: React.MouseEvent<HTMLButtonElement>, match: Match) => void;
}

export default function RecentMatchesCard({
  matches,
  totalCount,
  isLoading,
  onMatchClick,
  onOpenMenu,
}: RecentMatchesCardProps) {
  return (
    <section className="rounded-xl border border-app-border bg-app-card p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-app-border/50 bg-app-input text-emerald-400">
            <History size={16} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-app-text-primary">Recent Matches</h2>
            <p className="text-xs text-app-text-muted">Latest completed badminton sessions</p>
          </div>
        </div>

        {totalCount > 0 && (
          <Link
            href="/matches"
            className="flex items-center gap-1.5 rounded-lg border border-app-border bg-app-input px-3 py-1.5 text-xs font-semibold text-app-text-secondary transition-all hover:border-app-border-hover hover:bg-app-hover hover:text-app-text-primary"
          >
            <span>View All Matches</span>
            <ArrowRight size={13} className="text-app-text-muted" />
          </Link>
        )}
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="flex min-h-[200px] animate-pulse items-center justify-center rounded-xl border border-dashed border-app-border/50 text-xs text-app-text-muted">
          Loading recent matches...
        </div>
      ) : matches.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-app-border/50 bg-app-bg/50 px-6 py-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-app-border bg-app-card text-app-text-muted">
            <History size={18} />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-app-text-primary">No completed matches yet</h3>
          <p className="mt-1 text-xs text-app-text-muted">
            Matches will appear here once they are marked as completed.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-app-border/60">
          {matches.map((match) => {
            const [day, month] = formatShortDate(match.date).split(" ");
            const courtText = `${match.courtNumber || "4"} Courts`;
            const playersCount = match.players?.length || 0;

            return (
              <div
                key={match.id}
                className="group flex cursor-pointer flex-col justify-between py-3.5 px-2 transition-all rounded-lg hover:bg-app-hover sm:flex-row sm:items-center"
                onClick={() => onMatchClick(match)}
              >
                {/* Left: Date Badge & Title */}
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-app-border bg-app-bg py-1.5 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted">
                      {month}
                    </span>
                    <span className="text-base font-extrabold text-app-text-primary leading-tight">
                      {day}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h4 className="truncate font-semibold text-sm text-app-text-primary group-hover:text-blue-400 transition-colors">
                      {match.title}
                    </h4>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-app-text-secondary">
                      <span>{courtText}</span>
                      <span className="text-app-text-muted">•</span>
                      <span>{playersCount} Players</span>
                      {match.location && (
                        <>
                          <span className="text-app-text-muted">•</span>
                          <span className="flex items-center gap-1 truncate text-app-text-muted">
                            <MapPin size={11} className="shrink-0 text-app-text-muted" />
                            {match.location}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Time, Status, Actions */}
                <div className="mt-3 flex items-center justify-between gap-4 sm:mt-0 sm:justify-end">
                  <div className="flex items-center gap-1.5 text-xs text-app-text-muted">
                    <Clock size={13} className="text-app-text-muted" />
                    <span>{formatDurationHours(match.time)}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                      Completed
                    </span>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-app-text-muted hover:bg-app-hover hover:text-app-text-primary"
                      onClick={(event) => onOpenMenu(event, match)}
                      aria-label={`Actions for ${match.title}`}
                    >
                      <MoreVertical size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
