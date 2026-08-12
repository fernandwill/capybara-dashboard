import Link from "next/link";
import { ArrowRight, Clock, History, MoreVertical } from "lucide-react";
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
    <section className="rounded-xl border border-app-border bg-app-card p-5 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-app-text-primary">
          <History size={18} className="text-app-text-muted" />
          Recent Matches
        </h2>
        {totalCount > 0 && (
          <Link
            href="/matches"
            className="flex items-center gap-1 text-sm font-medium text-app-primary transition-colors hover:text-blue-400"
          >
            View All Match
            <ArrowRight size={12} />
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="flex min-h-[190px] animate-pulse items-center justify-center rounded-xl border border-dashed border-app-border/50 text-xs text-app-text-muted">
          Loading recent matches...
        </div>
      ) : matches.length === 0 ? (
        <div className="flex min-h-[190px] flex-col items-center justify-center rounded-xl border border-dashed border-app-border/50 bg-app-card px-6 text-center">
          <h3 className="text-sm font-medium text-app-text-primary">No completed matches yet</h3>
          <p className="mt-2 text-xs text-app-text-muted">Finish a match to see it here.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {matches.map((match) => {
            const [day, month] = formatShortDate(match.date).split(" ");
            return (
              <div
                key={match.id}
                className="group flex cursor-pointer flex-col justify-between rounded-lg border-b border-app-border/50 p-4 transition-colors last:border-0 hover:bg-[#1E232B] sm:flex-row sm:items-center"
                onClick={() => onMatchClick(match)}
              >
                <div className="mb-3 flex min-w-0 items-center gap-6 sm:mb-0">
                  <div className="w-12 shrink-0 text-center">
                    <div className="text-xs font-medium uppercase tracking-wider text-app-text-secondary">
                      {month}
                    </div>
                    <div className="text-xl font-bold text-white">{day}</div>
                  </div>
                  <div className="min-w-0">
                    <h4 className="truncate font-semibold text-white">{match.title}</h4>
                    <p className="mt-0.5 truncate text-sm text-app-text-secondary">{match.location}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-6 sm:w-1/2 sm:justify-end">
                  <div className="flex items-center gap-2 text-sm text-app-text-secondary">
                    <Clock size={14} />
                    {formatDurationHours(match.time)}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="rounded-full border border-app-success/20 bg-app-success-bg px-3 py-1 text-xs font-medium text-app-success-text">
                      Completed
                    </span>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-md text-app-text-muted transition-colors hover:bg-gray-700 hover:text-white"
                      onClick={(event) => onOpenMenu(event, match)}
                      aria-label={`Actions for ${match.title}`}
                    >
                      <MoreVertical size={15} />
                    </button>
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
