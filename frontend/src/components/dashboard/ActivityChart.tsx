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
    <div className="relative min-h-[256px] w-full flex-1">
      {/* Y-Axis Labels & Grid Lines */}
      <div className="pointer-events-none absolute inset-0 z-0 flex flex-col justify-between pb-8 text-xs font-medium text-app-text-muted">
        {gridLines.map((value) => (
          <div key={value} className="flex w-full items-center">
            <span className="w-8">{mode === "hours" ? `${value}h` : value}</span>
            <div className="h-px flex-1 bg-app-border/50" />
          </div>
        ))}
      </div>

      {/* X-Axis Labels & Bars */}
      <div className="absolute inset-x-8 bottom-0 top-0 z-10 flex items-end justify-between pb-8">
        {data.map((item) => {
          const value = mode === "hours" ? item.hours : item.matches;
          const height = value === 0 ? 0 : Math.max((value / gridMax) * 100, 2);
          return (
            <div
              key={item.month}
              className="group relative flex h-full w-[8%] flex-col items-center justify-end"
            >
              {value > 0 && (
                <div
                  className="pointer-events-none absolute left-1/2 z-20 hidden w-40 -translate-x-1/2 rounded-lg border border-app-border bg-[#1E232B] p-3 shadow-xl group-hover:block"
                  style={{ bottom: `calc(${height}% + 2.25rem)` }}
                >
                  <div className="mb-2 text-sm font-semibold text-white">
                    {item.month} {selectedYear}
                  </div>
                  <div className="mb-1 flex items-center gap-2 text-sm text-app-text-secondary">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-app-icon-blue" />
                    {item.matches} matches
                  </div>
                  <div className="flex items-center gap-2 text-sm text-app-text-secondary">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-app-success" />
                    {item.hours} hours
                  </div>
                </div>
              )}

              <div
                className="chart-bar w-full max-w-[24px] bg-app-success transition-opacity group-hover:opacity-80"
                style={{ height: `${height}%` }}
              />
              <span
                className={`mt-3 text-xs ${
                  item.month === "Mar" ? "font-medium text-white" : "text-app-text-muted"
                }`}
              >
                {item.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
