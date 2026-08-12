import { MonthlyPoint } from "@/hooks/useMonthlyStats";

interface ActivityChartProps {
  data: MonthlyPoint[];
  mode: "hours" | "matches";
  selectedYear: number;
}

export default function ActivityChart({
  data,
  mode,
  selectedYear,
}: ActivityChartProps) {
  const rawMax = Math.max(
    0,
    ...data.map((item) => (mode === "hours" ? item.hours : item.matches))
  );
  const gridMax = Math.max(
    mode === "hours" ? 16 : 4,
    Math.ceil(rawMax / 4) * 4
  );
  const gridLines = [gridMax, (gridMax * 3) / 4, gridMax / 2, gridMax / 4, 0];

  return (
    <div className="relative min-h-[240px] flex-1">
      {/* Grid */}
      <div className="absolute inset-0 flex flex-col justify-between">
        {gridLines.map((value) => (
          <div key={value} className="flex items-center gap-3">
            <span className="w-8 shrink-0 text-right text-[11px] text-white/40">
              {mode === "hours" ? `${value}h` : value}
            </span>

            <div className="h-px flex-1 bg-white/[0.07]" />
          </div>
        ))}
      </div>

      {/* Bars */}
      <div className="absolute bottom-0 left-11 right-0 top-0 flex items-end gap-2.5">
        {data.map((item) => {
          const value = mode === "hours" ? item.hours : item.matches;
          const height = value === 0 ? 0 : Math.max((value / gridMax) * 100, 2);

          return (
            <div
              key={item.month}
              className="group flex h-full flex-1 flex-col justify-end"
            >
              <div className="relative flex flex-1 items-end justify-center">
                {value > 0 && (
                  <div
                    className="relative w-4 rounded-t-sm bg-emerald-500/90 transition-all duration-200 group-hover:bg-emerald-400"
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/[0.1] bg-[#1c1d1d] px-4 py-3 shadow-xl group-hover:block">
                      <div className="text-xs font-medium">
                        {item.month} {selectedYear}
                      </div>

                      <div className="mt-2 space-y-1 text-xs text-white/60">
                        <div>🔵 {item.matches} matches</div>
                        <div>🟢 {item.hours} hours</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <span className="mt-3 text-center text-[11px] text-white/50">
                {item.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
