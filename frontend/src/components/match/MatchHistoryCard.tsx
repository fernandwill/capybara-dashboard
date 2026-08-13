"use client";

import { History } from "lucide-react";
import type { FinishedGameHistory } from "@/components/match/types";

interface MatchHistoryCardProps {
  history: FinishedGameHistory[];
}

/** Formats an ISO timestamp as "HH:MM" (e.g. round finish time). */
function formatTimeHM(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

/** Persisted finished-games feed: team vs team per round. */
export default function MatchHistoryCard({ history }: MatchHistoryCardProps) {
  return (
    <div className="rounded-2xl border border-app-border bg-app-bg p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-app-text-primary">
          <History size={15} className="text-app-text-muted" />
          <span>Match History</span>
        </h3>
        <span className="rounded-md border border-app-border bg-app-input px-2 py-0.5 text-[10px] font-medium text-app-text-muted">
          {history.length} round{history.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="max-h-64 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
        {history.length === 0 ? (
          <p className="py-6 text-center text-xs text-app-text-muted">
            No rounds recorded for this match yet.
          </p>
        ) : (
          history.map((g) => (
            <div
              key={g.id}
              className="rounded-xl border border-app-border bg-app-input p-2.5 text-xs text-app-text-secondary"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="font-semibold text-emerald-400">
                  {g.courtName}
                </span>
                <span className="text-[10px] font-medium text-app-text-muted">
                  {formatTimeHM(g.finishedAt)}
                </span>
              </div>
              <div className="text-[11px] text-app-text-muted">
                <span className="text-app-text-primary">{g.teamANames.join(" & ")}</span>{" "}
                <span className="text-app-text-muted font-bold">vs</span>{" "}
                <span className="text-app-text-primary">{g.teamBNames.join(" & ")}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
