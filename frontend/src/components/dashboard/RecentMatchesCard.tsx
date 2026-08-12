import { MoreVertical, Trophy } from "lucide-react";
import { Match } from "@/types/types";
import { formatCurrency, formatShortDate } from "@/utils/formatters";

interface RecentMatchesCardProps {
  matches: Match[];
  totalCount: number;
  showAll: boolean;
  isLoading: boolean;
  onToggleShowAll: () => void;
  onMatchClick: (match: Match) => void;
  onOpenMenu: (event: React.MouseEvent<HTMLButtonElement>, match: Match) => void;
}

export default function RecentMatchesCard({
  matches,
  totalCount,
  showAll,
  isLoading,
  onToggleShowAll,
  onMatchClick,
  onOpenMenu,
}: RecentMatchesCardProps) {
  return (
    <section className="mt-6 rounded-xl border border-white/[0.1] bg-[#141515] p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy size={19} className="text-white/50" />
          <h2 className="font-semibold">Recent Matches</h2>
        </div>

        {totalCount > 0 && (
          <button
            type="button"
            className="text-xs text-blue-400 transition hover:text-blue-300"
            onClick={onToggleShowAll}
          >
            {showAll ? "Show less" : "View all matches →"}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="mt-4 flex min-h-[160px] animate-pulse items-center justify-center rounded-xl border border-dashed border-white/[0.1] bg-black/10 text-xs text-white/40">
          Loading recent matches...
        </div>
      ) : matches.length === 0 ? (
        <div className="mt-4 flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.1] bg-black/10 px-6 text-center">
          <h3 className="text-sm font-medium">No completed matches yet</h3>

          <p className="mt-2 text-xs text-white/40">
            Finish a match to see it here.
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.07] bg-black/10">
          {/* Header */}
          <div className="hidden grid-cols-[110px_minmax(0,1fr)_170px_130px_36px] border-b border-white/[0.07] px-5 py-3 text-[10px] uppercase tracking-wider text-white/30 sm:grid">
            <span>Date</span>
            <span>Match</span>
            <span>Fee</span>
            <span>Status</span>
            <span />
          </div>

          {matches.map((match) => {
            const [day, month] = formatShortDate(match.date).split(" ");

            return (
              <div
                key={match.id}
                className="grid cursor-pointer grid-cols-1 gap-3 border-b border-white/[0.07] px-5 py-4 last:border-0 sm:grid-cols-[110px_minmax(0,1fr)_170px_130px_36px] sm:items-center"
                onClick={() => onMatchClick(match)}
              >
                {/* Date */}
                <div className="flex items-baseline gap-2 sm:block">
                  <span className="mr-2 text-[10px] text-white/30 sm:block">
                    {month}
                  </span>

                  <span className="text-lg font-medium">{day}</span>
                </div>

                {/* Match */}
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {match.title}
                  </div>

                  <div className="mt-1 truncate text-xs text-white/40">
                    {match.location}
                  </div>
                </div>

                {/* Fee */}
                <div>
                  <span className="inline-flex rounded-md border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-xs font-medium">
                    {formatCurrency(match.fee)}
                  </span>
                </div>

                {/* Status */}
                <div>
                  <span className="inline-flex rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-950">
                    Completed
                  </span>
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
