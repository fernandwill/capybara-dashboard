import { Clock3, Star, TrendingUp } from "lucide-react";
import { MonthlyPoint } from "@/hooks/useMonthlyStats";

interface InsightsCardProps {
  selectedYear: number;
  strongestMonth: MonthlyPoint | null;
  mostActiveDay: string | null;
  typicalStartHour: number | null;
}

function formatHourRange(startHour: number, span = 2): string {
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
    <div className="flex min-h-[420px] flex-col rounded-xl border border-white/[0.1] bg-[#141515] p-6">
      <div className="flex items-center gap-2">
        <TrendingUp size={19} className="text-emerald-400" />
        <h2 className="font-semibold">{selectedYear} Insights</h2>
      </div>

      <div className="mt-6 flex flex-1 flex-col justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-6">
        {strongestMonth && (
          <div className="flex gap-4">
            <Star
              size={23}
              className="mt-1 shrink-0 text-yellow-400"
              fill="currentColor"
            />

            <div>
              <h3 className="text-sm leading-6">
                {strongestMonth.month}{" "}
                <span className="font-semibold text-emerald-400">
                  was your strongest month.
                </span>
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/50">
                You played {strongestMonth.hours} hours across{" "}
                {strongestMonth.matches} matches.
              </p>
            </div>
          </div>
        )}

        {strongestMonth && mostActiveDay && (
          <div className="my-6 h-px bg-white/[0.1]" />
        )}

        {mostActiveDay && (
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <Clock3 size={16} />
            </div>

            <div>
              <h3 className="text-sm font-medium text-emerald-400">
                Most active day
              </h3>

              <p className="mt-1 text-sm text-white/80">{mostActiveDay}</p>

              <p className="mt-2 text-xs leading-5 text-white/40">
                You usually play between
                <br />
                {typicalStartHour !== null
                  ? formatHourRange(typicalStartHour)
                  : "—"}
                .
              </p>
            </div>
          </div>
        )}

        {!hasData && (
          <div className="flex gap-4">
            <Star size={23} className="shrink-0 text-white/20" />

            <div>
              <h3 className="text-sm leading-6 text-white/60">No data yet.</h3>

              <p className="mt-2 text-sm leading-6 text-white/40">
                Play some matches to unlock your insights.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
