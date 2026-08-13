"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import {
  IconCalendarEvent,
  IconCheck,
  IconChevronRight,
  IconChevronLeft,
  IconClock,
  IconDotsVertical,
  IconPlus,
} from "@tabler/icons-react";
import { Match } from "@/types/types";

interface UpcomingMatchesCardProps {
  matches: Match[];
  isLoading: boolean;
  onNewMatch: () => void;
  onMatchClick: (match: Match) => void;
  onOpenMenu: (event: React.MouseEvent<HTMLButtonElement>, match: Match) => void;
}

function getMatchDateParts(dateString: string) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { month: "TBD", day: "--", weekday: "---" };
  }
  const month = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const day = String(date.getDate()).padStart(2, "0");
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  return { month, day, weekday };
}

function formatTimeDuration(timeString: string) {
  if (!timeString || !timeString.includes("-")) return "Time not set";
  try {
    const [start, end] = timeString.split("-").map((t) => t.trim());
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);

    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return timeString;

    const startDate = new Date();
    startDate.setHours(startH, startM, 0, 0);
    const endDate = new Date();
    endDate.setHours(endH, endM, 0, 0);

    let diff = endDate.getTime() - startDate.getTime();
    if (diff < 0) diff += 24 * 60 * 60 * 1000;

    const hours = Math.round((diff / (1000 * 60 * 60)) * 10) / 10;
    return `${start} - ${end} (${hours} hrs)`;
  } catch {
    return timeString;
  }
}

function getMatchCountdown(match: Match): string {
  try {
    const matchDate = new Date(match.date);
    const timeString = match.time?.split("-")[0]?.trim() || "00:00";
    const [hours, minutes] = timeString.split(":").map(Number);

    const matchDateTime = new Date(matchDate);
    matchDateTime.setHours(hours || 0, minutes || 0, 0, 0);

    const now = new Date();
    const timeDiff = matchDateTime.getTime() - now.getTime();

    if (timeDiff <= 0) {
      return "Starting soon";
    }

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `In ${days}d ${hoursLeft}h ${minutesLeft}m`;
    } else if (hoursLeft > 0) {
      return `In ${hoursLeft}h ${minutesLeft}m`;
    } else if (minutesLeft > 0) {
      return `In ${minutesLeft}m`;
    } else {
      return "Starting soon";
    }
  } catch {
    return "Upcoming";
  }
}

export default function UpcomingMatchesCard({
  matches,
  isLoading,
  onNewMatch,
  onMatchClick,
  onOpenMenu,
}: UpcomingMatchesCardProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [matches]);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 340;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 300);
    }
  };

  return (
    <section className="rounded-xl border border-app-border bg-app-card p-5 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconCalendarEvent size={18} className="text-app-text-muted" />
          <h2 className="text-base font-bold text-app-text-primary">Upcoming Matches</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNewMatch}
            className="flex items-center gap-1 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-500"
          >
            <IconPlus size={14} />
            <span>New Match</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex min-h-[200px] animate-pulse items-center justify-center rounded-2xl border border-dashed border-app-border bg-app-input text-xs text-app-text-muted">
          Loading upcoming matches...
        </div>
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-app-border bg-app-input py-10 text-center">
          <div className="relative mb-3">
            <IconCalendarEvent size={40} strokeWidth={1.5} className="text-app-text-muted" />
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-app-input">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                <IconCheck size={10} />
              </div>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-app-text-primary">No upcoming matches</h3>
          <p className="mt-1 text-xs text-app-text-muted">
            You&apos;re all caught up. Schedule your next match when you&apos;re ready.
          </p>
          <button
            type="button"
            onClick={onNewMatch}
            className="mt-4 flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
          >
            <IconPlus size={14} />
            <span>Schedule a Match</span>
          </button>
        </div>
      ) : (
        <div className="relative group">
          {/* Scroll Navigation Left Button */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => handleScroll("left")}
              className="absolute -left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-app-border bg-app-bg/95 text-app-text-primary shadow-xl backdrop-blur transition hover:bg-app-hover"
              aria-label="Scroll left"
            >
              <IconChevronLeft size={16} />
            </button>
          )}

          {/* Cards Carousel Container */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex gap-4 overflow-x-auto pb-1 pt-1 scroll-smooth no-scrollbar"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {matches.map((match) => {
              const { month, day, weekday } = getMatchDateParts(match.date);
              const playersCount = match.players?.length || 0;
              const courtCount = match.courtNumber || "4";
              const countdownStr = getMatchCountdown(match);

              return (
                <div
                  key={match.id}
                  onClick={() => onMatchClick(match)}
                  className="flex w-[290px] sm:w-[310px] shrink-0 cursor-pointer flex-col justify-between rounded-2xl border border-app-border bg-app-input p-4 transition-all hover:border-app-border-hover hover:shadow-lg group/card"
                >
                  {/* Card Top: Date Badge (Left) + Match Details (Middle) + Status & Menu (Right) */}
                  <div className="flex items-start justify-between gap-2.5">
                    {/* Left: Date Badge */}
                    <div className="flex flex-col items-center justify-center rounded-xl bg-app-bg px-2.5 py-1.5 border border-app-border shrink-0 text-center min-w-[48px]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted">
                        {month}
                      </span>
                      <span className="text-xl font-black text-app-text-primary leading-tight">
                        {day}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        {weekday}
                      </span>
                    </div>

                    {/* Middle: Title & Meta */}
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-xs font-bold text-app-text-primary transition group-hover/card:text-blue-400">
                        {match.title}
                      </h4>
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-app-text-muted">
                        <IconClock size={11} className="shrink-0 text-app-text-muted" />
                        <span className="truncate">{formatTimeDuration(match.time)}</span>
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-app-text-muted">
                        {courtCount} Courts • {playersCount} Players
                      </p>
                    </div>

                    {/* Right: UPCOMING badge + 3-dots Menu */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                        Upcoming
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenMenu(e, match);
                        }}
                        className="rounded p-1 text-app-text-muted transition hover:bg-app-hover hover:text-app-text-primary"
                        aria-label={`Actions for ${match.title}`}
                      >
                        <IconDotsVertical size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Card Middle: Players Stack */}
                  <div className="my-3 space-y-1.5 border-t border-app-border pt-3">
                    <span className="text-[11px] font-medium text-app-text-muted">
                      Players ({playersCount})
                    </span>
                    <div className="flex items-center -space-x-1 overflow-hidden py-0.5">
                      {playersCount === 0 ? (
                        <span className="text-[11px] text-app-text-muted italic">
                          No players joined yet
                        </span>
                      ) : (
                        <>
                          {match.players?.slice(0, 11).map((mp) => {
                            const playerName = mp.player?.name || "Player";
                            return (
                              <Image
                                key={mp.player?.id}
                                src="/capybara-avatar.png"
                                alt={playerName}
                                title={playerName}
                                width={400}
                                height={383}
                                className="h-6 w-6 shrink-0 rounded-full object-cover ring-2 ring-app-input shadow-sm"
                              />
                            );
                          })}
                          {playersCount > 11 && (
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-app-input text-[9px] font-bold text-app-text-secondary ring-2 ring-app-input">
                              +{playersCount - 11}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Countdown + View Details Button */}
                  <div className="flex items-center justify-between border-t border-app-border pt-2.5">
                    <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                      <IconClock size={12} className="shrink-0 text-emerald-400" />
                      <span className="truncate">{countdownStr}</span>
                    </div>

                    <div className="flex items-center gap-1 rounded-xl border border-app-border bg-app-bg px-2.5 py-1 text-[11px] font-medium text-app-text-secondary transition group-hover/card:border-app-border-hover group-hover/card:bg-app-hover group-hover/card:text-app-text-primary">
                      <span>View Details</span>
                      <IconChevronRight size={12} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Scroll Navigation Right Button */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => handleScroll("right")}
              className="absolute -right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-app-border bg-app-bg/95 text-app-text-primary shadow-xl backdrop-blur transition hover:bg-app-hover"
              aria-label="Scroll right"
            >
              <IconChevronRight size={16} />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
