"use client";

import React from "react";
import Image from "next/image";
import {
  IconCalendarClock,
  IconCrown,
  IconMapPin,
  IconSparkles,
  IconStar,
  IconUserPlus,
} from "@tabler/icons-react";
import { MonthlyPoint } from "@/hooks/use-monthly-stats";

export interface TopPlayerPresence {
  id: string;
  name: string;
}

export interface FavoriteCentre {
  name: string;
  count: number;
}

export interface MostPresenceInsight {
  players: TopPlayerPresence[];
  count: number;
}

interface InsightsCardProps {
  selectedYear: number;
  strongestMonth: MonthlyPoint | null;
  mostActiveDay: string | null;
  typicalStartHour: number | null;
  favoriteCentre: FavoriteCentre | null;
  mostPresence: MostPresenceInsight | null;
  newBloodCount: number;
  isLoading?: boolean;
}

function formatHourRange(startHour: number, span = 3): string {
  const format = (hour: number) => {
    const normalized = ((hour % 24) + 24) % 24;
    const twelve = normalized % 12 === 0 ? 12 : normalized % 12;
    return `${twelve}${normalized < 12 ? "AM" : "PM"}`;
  };
  return `${format(startHour)} - ${format(startHour + span)}`;
}

export default function InsightsCard({
  selectedYear,
  strongestMonth,
  mostActiveDay,
  typicalStartHour,
  favoriteCentre,
  mostPresence,
  newBloodCount,
  isLoading = false,
}: InsightsCardProps) {
  const hasData =
    favoriteCentre !== null ||
    mostPresence !== null ||
    newBloodCount > 0 ||
    strongestMonth !== null ||
    mostActiveDay !== null;

  if (isLoading) {
    return (
      <aside className="flex h-full min-w-0 flex-col rounded-xl border border-app-border bg-app-card p-5 sm:p-6 animate-pulse">
        <div className="mb-4 h-6 w-36 rounded bg-app-border" />
        <div className="space-y-3">
          <div className="h-20 rounded-xl bg-app-border/60" />
          <div className="h-20 rounded-xl bg-app-border/60" />
          <div className="h-20 rounded-xl bg-app-border/60" />
          <div className="h-16 rounded-xl bg-app-border/60" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full min-w-0 flex-col rounded-xl border border-app-border bg-app-card p-5 sm:p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconSparkles size={18} className="text-amber-400" />
          <h2 className="text-base font-bold text-app-text-primary">{selectedYear} Insights</h2>
        </div>
        <span className="rounded-full border border-app-border bg-app-input px-2.5 py-0.5 text-[11px] font-semibold text-app-text-secondary">
          Highlights
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {/* 1. Favorite Badminton Centre */}
        <div className="rounded-xl border border-app-border bg-app-input p-3.5 transition hover:border-app-border-hover">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
              <IconMapPin size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-app-text-muted">
                  Favorite Badminton Centre
                </span>
                {favoriteCentre && (
                  <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                    {favoriteCentre.count} {favoriteCentre.count === 1 ? "match" : "matches"}
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-sm font-bold text-app-text-primary">
                {favoriteCentre ? favoriteCentre.name : "No location data"}
              </p>
              <p className="mt-0.5 text-xs text-app-text-muted">
                {favoriteCentre
                  ? `Most played venue in ${selectedYear}`
                  : `Play matches in ${selectedYear} to track favorite centres`}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Most Presence */}
        <div className="rounded-xl border border-app-border bg-app-input p-3.5 transition hover:border-app-border-hover">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
              <IconCrown size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-app-text-muted">
                  Most Presence
                </span>
                {mostPresence && (
                  <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                    {mostPresence.count} {mostPresence.count === 1 ? "match" : "matches"}
                  </span>
                )}
              </div>

              {mostPresence ? (
                <div className="mt-1.5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {mostPresence.players.slice(0, 3).map((p) => (
                        <Image
                          key={p.id}
                          src="/capybara-avatar.png"
                          alt={p.name}
                          title={p.name}
                          width={400}
                          height={383}
                          className="h-6 w-6 rounded-full object-cover ring-2 ring-app-input"
                        />
                      ))}
                    </div>
                    <span className="truncate text-xs font-bold text-app-text-primary">
                      {mostPresence.players.map((p) => p.name).join(", ")}
                    </span>
                  </div>
                  <p className="text-[11px] text-app-text-muted">
                    {mostPresence.players.length > 1
                      ? `Tied with ${mostPresence.count} match attendances each`
                      : `Top attendance MVP in ${selectedYear}`}
                  </p>
                </div>
              ) : (
                <>
                  <p className="mt-0.5 truncate text-sm font-bold text-app-text-primary">
                    No attendance records
                  </p>
                  <p className="mt-0.5 text-xs text-app-text-muted">
                    Attendance will update as players join matches
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 3. New Blood */}
        <div className="rounded-xl border border-app-border bg-app-input p-3.5 transition hover:border-app-border-hover">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
              <IconUserPlus size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-app-text-muted">
                  New Blood
                </span>
                <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-400">
                  {selectedYear}
                </span>
              </div>
              <p className="mt-0.5 text-sm font-bold text-app-text-primary">
                {newBloodCount > 0 ? (
                  <span>
                    +{newBloodCount} {newBloodCount === 1 ? "New Player" : "New Players"}
                  </span>
                ) : (
                  <span>0 New Players</span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-app-text-muted">
                {newBloodCount > 0
                  ? `Joined the badminton community in ${selectedYear}`
                  : `No new players added yet in ${selectedYear}`}
              </p>
            </div>
          </div>
        </div>

        {/* 4. Activity Rhythm: Strongest Month & Peak Time */}
        {(strongestMonth || mostActiveDay) && (
          <div className="mt-auto rounded-xl border border-app-border bg-app-bg p-3">
            <div className="flex items-center gap-2 text-[11px] font-bold text-app-text-secondary">
              <IconCalendarClock size={13} className="text-emerald-400 shrink-0" />
              <span>Activity Rhythm</span>
            </div>
            <div className="mt-1.5 space-y-1 text-xs text-app-text-muted">
              {strongestMonth && (
                <p className="truncate">
                  <span className="text-app-text-secondary font-semibold">{strongestMonth.month}:</span>{" "}
                  {strongestMonth.hours}h across {strongestMonth.matches} matches (Peak Month)
                </p>
              )}
              {mostActiveDay && (
                <p className="truncate">
                  <span className="text-app-text-secondary font-semibold">{mostActiveDay}s:</span>{" "}
                  Usually {typicalStartHour !== null ? formatHourRange(typicalStartHour) : "—"}
                </p>
              )}
            </div>
          </div>
        )}

        {!hasData && (
          <div className="rounded-xl border border-dashed border-app-border p-6 text-center">
            <IconStar size={20} className="mx-auto text-app-text-muted" />
            <h3 className="mt-3 text-sm font-medium text-app-text-primary">No insights yet</h3>
            <p className="mt-1 text-xs text-app-text-muted">
              Play some matches in {selectedYear} to unlock insights.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
