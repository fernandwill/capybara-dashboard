import {
  CalendarDays,
  Clock,
  Clock3,
  Hash,
  MoreVertical,
  Users,
} from "lucide-react";
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
    <section className="mt-6 rounded-xl border border-white/[0.1] bg-[#141515] p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays size={19} className="text-white/50" />
          <h2 className="font-semibold">Upcoming Matches</h2>
        </div>

        <button
          type="button"
          className="rounded-full bg-blue-600 px-5 py-2 text-xs font-medium text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
          onClick={onNewMatch}
        >
          + New Match
        </button>
      </div>

      {isLoading ? (
        <div className="mt-4 flex min-h-[200px] animate-pulse items-center justify-center rounded-xl border border-dashed border-white/[0.1] bg-black/10 text-xs text-white/40">
          Loading upcoming matches...
        </div>
      ) : matches.length === 0 ? (
        <div className="mt-4 flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.1] bg-black/10 text-center">
          <CalendarDays
            size={44}
            strokeWidth={1.4}
            className="text-white/30"
          />

          <h3 className="mt-4 text-sm font-medium">No upcoming matches</h3>

          <p className="mt-2 text-xs text-white/40">
            You&apos;re all caught up.
            <br />
            Schedule your next match when you&apos;re ready.
          </p>

          <button
            type="button"
            className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-medium text-white transition hover:bg-blue-500"
            onClick={onNewMatch}
          >
            + Schedule a match
          </button>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-white/[0.07]">
          {matches.map((match) => {
            const [day, month] = formatShortDate(match.date).split(" ");

            return (
              <div
                key={match.id}
                className="grid cursor-pointer grid-cols-1 gap-4 py-4 first:pt-1 last:pb-1 sm:grid-cols-[90px_minmax(0,1fr)_auto] sm:items-center"
                onClick={() => onMatchClick(match)}
              >
                {/* Date */}
                <div>
                  <span className="mr-2 text-[10px] text-white/30 sm:block">
                    {month}
                  </span>

                  <span className="text-lg font-medium">{day}</span>
                </div>

                {/* Match info */}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{match.title}</span>

                    {closestMatch?.id === match.id && countdown && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.1] bg-white/[0.04] px-2 py-0.5 text-[10px] text-emerald-400">
                        <Clock3 size={11} />
                        {countdown}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 text-xs text-white/40">
                    {match.location}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/50">
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} />
                      {match.time}
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Hash size={12} />
                      Court {match.courtNumber}
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Users size={12} />
                      {match.players?.length || 0} Players
                    </span>
                  </div>
                </div>

                {/* More */}
                <button
                  type="button"
                  className="justify-self-end text-white/40 transition hover:text-white sm:justify-self-auto"
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
