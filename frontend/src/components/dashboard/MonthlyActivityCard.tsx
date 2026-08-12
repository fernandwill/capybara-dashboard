"use client";

import { useState } from "react";
import ActivityChart from "./ActivityChart";
import { MonthlyPoint } from "@/hooks/useMonthlyStats";

interface MonthlyActivityCardProps {
  data: MonthlyPoint[];
  selectedYear: number;
  isLoading: boolean;
}

export default function MonthlyActivityCard({
  data,
  selectedYear,
  isLoading,
}: MonthlyActivityCardProps) {
  const [chartMode, setChartMode] = useState<"hours" | "matches">("hours");

  return (
    <section className="flex h-full flex-col rounded-xl border border-app-border bg-app-card p-5 sm:p-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-app-text-primary">Monthly Activity</h2>
        <div className="flex rounded-lg border border-app-border bg-[#1E232B] p-1">
          {(["hours", "matches"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                chartMode === mode
                  ? "bg-[#282C35] text-white shadow-sm"
                  : "text-app-text-secondary hover:text-white"
              }`}
              onClick={() => setChartMode(mode)}
            >
              {mode === "hours" ? "Hours" : "Matches"}
            </button>
          ))}
        </div>
      </div>

      <div className={`flex flex-1 flex-col ${isLoading ? "animate-pulse" : ""}`}>
        <ActivityChart data={data} mode={chartMode} selectedYear={selectedYear} />
      </div>

      <p className="mt-4 text-sm text-app-text-muted">
        Track your playing time and matches throughout the year.
      </p>
    </section>
  );
}
