"use client";

import React, { useState } from "react";
import { MonthlyPoint } from "@/hooks/use-monthly-stats";

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
  const [tappedMonthIdx, setTappedMonthIdx] = useState<number | null>(null);

  const rawMax = Math.max(
    0,
    ...data.map((item) => (mode === "hours" ? item.hours : item.matches))
  );

  const gridMax = Math.max(
    mode === "hours" ? 16 : 4,
    Math.ceil(rawMax / 4) * 4
  );

  const gridLines = [
    gridMax,
    Math.round((gridMax * 3) / 4),
    Math.round(gridMax / 2),
    Math.round(gridMax / 4),
    0,
  ];

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth();

  return (
    <div className="flex h-full min-h-[260px] w-full flex-1 flex-col justify-between">
      {/* Chart Plot Area + Y Axis */}
      <div className="relative flex flex-1 items-stretch gap-3 min-h-[200px]">
        {/* Y-Axis labels */}
        <div className="flex flex-col justify-between text-right text-[11px] font-medium text-app-text-muted select-none w-8 shrink-0 py-0.5">
          {gridLines.map((value) => (
            <span key={value} className="leading-none">
              {mode === "hours" ? `${value}h` : value}
            </span>
          ))}
        </div>

        {/* Plot surface */}
        <div className="relative flex-1">
          {/* Background horizontal grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-0.5">
            {gridLines.map((value, idx) => (
              <div
                key={value}
                className={`w-full border-b ${
                  idx === gridLines.length - 1
                    ? "border-app-border"
                    : "border-app-border/70"
                }`}
              />
            ))}
          </div>

          {/* Bar Columns layer */}
          <div className="absolute inset-0 flex items-end justify-between px-1 sm:px-2">
            {data.map((item, idx) => {
              const value = mode === "hours" ? item.hours : item.matches;
              const percentage = gridMax > 0 ? (value / gridMax) * 100 : 0;
              const hasValue = value > 0;
              const isCurrentMonth =
                selectedYear === currentYear && idx === currentMonthIndex;
              const isTapped = tappedMonthIdx === idx;

              return (
                <div
                  key={item.month}
                  onClick={() => setTappedMonthIdx((prev) => (prev === idx ? null : idx))}
                  className="group relative flex h-full flex-1 flex-col items-center justify-end px-0.5 sm:px-1 cursor-pointer"
                >
                  {/* Floating Hover/Tap Tooltip */}
                  <div className={`pointer-events-none absolute bottom-full mb-2 z-30 flex-col items-center ${isTapped ? "flex" : "hidden group-hover:flex"}`}>
                    <div className="rounded-lg border border-app-border bg-app-card px-2.5 py-1.5 shadow-xl text-center backdrop-blur whitespace-nowrap">
                      <div className="text-[11px] font-bold text-app-text-primary">
                        {item.month} {selectedYear}
                      </div>
                      <div className="mt-0.5 text-[10px] text-app-text-secondary">
                        <span
                          className={`font-semibold ${
                            mode === "hours" ? "text-yellow-400" : "text-amber-400"
                          }`}
                        >
                          {mode === "hours"
                            ? `${item.hours}h played`
                            : `${item.matches} matches`}
                        </span>
                        {mode === "hours" && (
                          <span className="text-app-text-muted ml-1">
                            ({item.matches} {item.matches === 1 ? "match" : "matches"})
                          </span>
                        )}
                        {mode === "matches" && (
                          <span className="text-app-text-muted ml-1">
                            ({item.hours}h)
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Tooltip caret */}
                    <div className="h-1.5 w-1.5 -translate-y-1 rotate-45 border-b border-r border-app-border bg-app-card" />
                  </div>

                  {/* Bar graphic */}
                  <div className="relative w-full max-w-[28px] flex flex-col items-center justify-end h-full">
                    {hasValue ? (
                      <div
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          mode === "hours"
                            ? "bg-gradient-to-t from-amber-500 to-yellow-400 group-hover:from-amber-400 group-hover:to-yellow-300 shadow-sm shadow-yellow-950/40"
                            : "bg-gradient-to-t from-amber-700 to-amber-500 group-hover:from-amber-600 group-hover:to-amber-400 shadow-sm shadow-amber-950/40"
                        }`}
                        style={{ height: `${Math.max(percentage, 4)}%` }}
                      />
                    ) : (
                      <div
                        className={`h-1 w-full max-w-[12px] rounded-full transition ${
                          isCurrentMonth
                            ? "bg-app-border"
                            : "bg-app-border opacity-60 group-hover:bg-app-hover"
                        }`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* X-Axis Month Labels */}
      <div className="flex items-center justify-between pl-11 pr-1 sm:pr-2 pt-2.5 border-t border-app-border/80 mt-1">
        {data.map((item, idx) => {
          const value = mode === "hours" ? item.hours : item.matches;
          const isCurrentMonth =
            selectedYear === currentYear && idx === currentMonthIndex;

          return (
            <div key={item.month} className="flex-1 text-center">
              <span
                className={`text-xs select-none transition ${
                  isCurrentMonth
                    ? "font-bold text-yellow-400 underline underline-offset-4 decoration-yellow-500/50"
                    : value > 0
                    ? "font-semibold text-app-text-primary"
                    : "font-normal text-app-text-muted hover:text-app-text-secondary"
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
