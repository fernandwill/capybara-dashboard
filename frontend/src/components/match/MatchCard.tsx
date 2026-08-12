"use client";

import {
  Banknote,
  Clock,
  Hash,
  MapPin,
  MoreVertical,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Match } from "@/types/types";
import {
  formatCurrency,
  formatDurationHours,
  formatShortDate,
} from "@/utils/formatters";

interface MatchCardProps {
  match: Match;
  onClick: (match: Match) => void;
  onOpenMenu: (event: React.MouseEvent<HTMLButtonElement>, match: Match) => void;
}

/** Single match card used in the 3x3 history grid. */
export default function MatchCard({ match, onClick, onOpenMenu }: MatchCardProps) {
  const [day, month] = formatShortDate(match.date).split(" ");
  const isCompleted = match.status === "COMPLETED";

  return (
    <div
      onClick={() => onClick(match)}
      className="group relative flex flex-col justify-between rounded-xl border border-app-border bg-app-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-600 hover:shadow-lg cursor-pointer"
    >
      {/* Top Row: Date Badge, Status Badge, Row Menu */}
      <div>
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg border border-app-border bg-app-bg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted">
                {month}
              </span>
              <span className="text-base font-bold text-white leading-none">
                {day}
              </span>
            </div>
            <div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  isCompleted
                    ? "border border-app-success/20 bg-app-success-bg text-app-success-text"
                    : "border border-blue-500/20 bg-blue-500/10 text-blue-400"
                }`}
              >
                {isCompleted ? "Completed" : "Upcoming"}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-app-text-muted hover:bg-gray-700 hover:text-white"
            onClick={(e) => onOpenMenu(e, match)}
            aria-label={`Actions for ${match.title}`}
          >
            <MoreVertical size={16} />
          </Button>
        </div>

        {/* Title & Location */}
        <h3 className="line-clamp-1 text-lg font-bold text-white transition group-hover:text-app-primary">
          {match.title}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 line-clamp-1 text-sm text-app-text-secondary">
          <MapPin size={14} className="shrink-0 text-app-text-muted" />
          <span className="truncate">{match.location}</span>
        </p>

        {/* Meta Information Grid */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 rounded-lg border border-app-border/50 bg-app-bg/50 p-3 text-xs text-app-text-secondary">
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-app-text-muted shrink-0" />
            <span className="truncate">{match.time}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Hash size={13} className="text-app-text-muted shrink-0" />
            <span className="truncate">Court {match.courtNumber}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={13} className="text-app-text-muted shrink-0" />
            <span>{match.players?.length || 0} Players</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Banknote size={13} className="text-app-text-muted shrink-0" />
            <span className="font-semibold text-app-success-text truncate">
              {formatCurrency(match.fee)}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-app-border/40 pt-3 text-xs">
        <span className="text-app-text-muted">
          Duration: {formatDurationHours(match.time)}
        </span>
        <span className="font-medium text-app-primary transition group-hover:underline">
          View Details →
        </span>
      </div>
    </div>
  );
}
