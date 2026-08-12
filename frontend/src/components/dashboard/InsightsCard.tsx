import { CalendarClock, Star, TrendingUp } from "lucide-react";
import { MonthlyPoint } from "@/hooks/useMonthlyStats";

interface InsightsCardProps {
  selectedYear: number;
  strongestMonth: MonthlyPoint | null;
  mostActiveDay: string | null;
  typicalStartHour: number | null;
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
}: InsightsCardProps) {
  const hasData = strongestMonth !== null || mostActiveDay !== null;

  return (
    <aside className="flex h-full min-w-0 flex-col rounded-xl border border-app-border bg-app-card p-5 sm:p-6">
      <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-app-text-primary">
        <TrendingUp size={18} className="text-app-success" />
        {selectedYear} Insights
      </h2>

      <div className="flex flex-1 flex-col space-y-4">
        {strongestMonth && (
          <div className="rounded-xl border border-app-border/50 bg-[#1C2128] p-4">
            <div className="flex items-start gap-3">
              <Star size={18} className="mt-1 shrink-0 text-yellow-500" fill="currentColor" />
              <div>
                <h3 className="mb-1 font-medium text-app-text-primary">
                  <span className="text-white">{strongestMonth.month}</span> was your{" "}
                  <span className="text-app-success">strongest month</span>.
                </h3>
                <p className="text-sm leading-relaxed text-app-text-secondary">
                  You played {strongestMonth.hours} hours across {strongestMonth.matches} matches.
                </p>
              </div>
            </div>
          </div>
        )}

        {mostActiveDay && (
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-app-success/20 text-app-success">
                <CalendarClock size={12} />
              </div>
              <div>
                <h3 className="mb-1 font-medium text-app-text-secondary">Most active day</h3>
                <p className="mb-2 text-lg font-semibold text-white">{mostActiveDay}</p>
                <p className="text-sm leading-relaxed text-app-text-secondary">
                  You usually play between{" "}
                  {typicalStartHour !== null ? formatHourRange(typicalStartHour) : "—"}.
                </p>
              </div>
            </div>
          </div>
        )}

        {!hasData && (
          <div className="rounded-xl border border-dashed border-app-border/50 p-6 text-center">
            <Star size={20} className="mx-auto text-app-text-muted" />
            <h3 className="mt-3 text-sm font-medium text-app-text-primary">No insights yet</h3>
            <p className="mt-2 text-sm leading-relaxed text-app-text-muted">
              Play some matches to unlock your activity insights.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
