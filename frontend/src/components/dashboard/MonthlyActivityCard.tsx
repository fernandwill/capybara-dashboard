"use client";

import { useState } from "react";
import { IconChartBar } from "@tabler/icons-react";
import { Button } from "@/components/ui/Button";
import ActivityChart from "./ActivityChart";
import { MonthlyPoint } from "@/hooks/use-monthly-stats";

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
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-400">
            <IconChartBar size={16} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-app-text-primary">Monthly Activity</h2>
            <p className="text-xs text-app-text-muted">Playing hours and match volume</p>
          </div>
        </div>
        <div className="flex rounded-lg border border-app-border bg-app-input p-1">
          {(["hours", "matches"] as const).map((mode) => (
            <Button
              key={mode}
              variant="ghost"
              size="sm"
              className={`rounded-md px-4 py-1.5 font-medium ${
                chartMode === mode
                  ? "bg-app-selected text-app-text-primary shadow-sm hover:bg-app-selected"
                  : "text-app-text-secondary hover:text-app-text-primary"
              }`}
              onClick={() => setChartMode(mode)}
            >
              {mode === "hours" ? "Hours" : "Matches"}
            </Button>
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
