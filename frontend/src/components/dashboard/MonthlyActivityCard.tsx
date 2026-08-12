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
    <div className="flex min-h-[420px] flex-col rounded-xl border border-white/[0.1] bg-[#141515] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Monthly Activity</h2>

        <div className="flex rounded-lg border border-white/[0.08] bg-black/20 p-1">
          <button
            type="button"
            className={`rounded-md px-4 py-1.5 text-xs transition ${
              chartMode === "hours" ? "bg-white/[0.08]" : "text-white/40"
            }`}
            onClick={() => setChartMode("hours")}
          >
            Hours
          </button>
          <button
            type="button"
            className={`rounded-md px-4 py-1.5 text-xs transition ${
              chartMode === "matches" ? "bg-white/[0.08]" : "text-white/40"
            }`}
            onClick={() => setChartMode("matches")}
          >
            Matches
          </button>
        </div>
      </div>

      <div className={`mt-6 flex flex-1 flex-col ${isLoading ? "animate-pulse" : ""}`}>
        <ActivityChart data={data} mode={chartMode} selectedYear={selectedYear} />
      </div>

      <p className="mt-5 text-xs text-white/40">
        Track your playing time and matches throughout the year.
      </p>
    </div>
  );
}
