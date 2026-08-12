import { CalendarDays, Check, Clock, Clock3, Hash, MoreVertical, Users } from "lucide-react";
import { Match } from "@/types/types";
import { formatShortDate } from "@/utils/formatters";

interface UpcomingMatchesCardProps {
  matches: Match[];
  closestMatch: Match | null;
  countdown: string;
  isLoading: boolean;
  onNewMatch: () => void;
  onMatchClick: (match: Match) => void;
  onOpenMenu: (event: React.MouseEvent<HTMLButtonElement>, match: Match) => void;
}

export default function UpcomingMatchesCard({
  matches,
  closestMatch,
  countdown,
  isLoading,
  onNewMatch,
  onMatchClick,
  onOpenMenu,
}: UpcomingMatchesCardProps) {
  return (
    <section className="rounded-xl border border-app-border bg-app-card p-5 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-app-text-primary">
          <CalendarDays size={18} className="text-app-text-muted" />
          Upcoming Matches
        </h2>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg bg-app-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-app-primary-hover"
          onClick={onNewMatch}
        >
          + New Match
        </button>
      </div>

      {isLoading ? (
        <div className="flex min-h-[250px] animate-pulse items-center justify-center rounded-xl border border-dashed border-app-border/50 text-xs text-app-text-muted">
          Loading upcoming matches...
        </div>
      ) : matches.length === 0 ? (
        <div className="dashed-border flex flex-col items-center justify-center py-16 text-center">
          <div className="relative mb-4">
            <CalendarDays size={44} strokeWidth={1.5} className="text-app-text-muted" />
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-app-bg">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-app-success text-xs text-white">
                <Check size={12} />
              </div>
            </div>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-white">No upcoming matches</h3>
          <p className="mb-6 max-w-sm text-sm text-app-text-secondary">
            You&apos;re all caught up.
            <br />
            Schedule your next match when you&apos;re ready.
          </p>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-app-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-app-primary-hover"
            onClick={onNewMatch}
          >
            + Schedule a match
          </button>
        </div>
      ) : (
        <div className="divide-y divide-app-border/50">
          {matches.map((match) => {
            const [day, month] = formatShortDate(match.date).split(" ");
            return (
              <div
                key={match.id}
                className="grid cursor-pointer grid-cols-1 gap-4 py-5 first:pt-0 last:pb-0 sm:grid-cols-[90px_minmax(0,1fr)_auto] sm:items-center"
                onClick={() => onMatchClick(match)}
              >
                <div className="text-center sm:text-left">
                  <div className="text-xs font-medium uppercase tracking-wider text-app-text-secondary">
                    {month}
                  </div>
                  <div className="text-xl font-bold text-white">{day}</div>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="truncate font-semibold text-white">{match.title}</h4>
                    {closestMatch?.id === match.id && countdown && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-app-border bg-white/[0.04] px-2 py-0.5 text-[10px] text-app-success-text">
                        <Clock3 size={11} />
                        {countdown}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-app-text-secondary">{match.location}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-app-text-secondary">
                    <span className="flex items-center gap-2">
                      <Clock size={14} />
                      {match.time}
                    </span>
                    <span className="flex items-center gap-2">
                      <Hash size={14} />
                      Court {match.courtNumber}
                    </span>
                    <span className="flex items-center gap-2">
                      <Users size={14} />
                      {match.players?.length || 0} Players
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="justify-self-end text-app-text-muted transition hover:text-white sm:justify-self-auto"
                  onClick={(event) => onOpenMenu(event, match)}
                  aria-label={`Actions for ${match.title}`}
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
