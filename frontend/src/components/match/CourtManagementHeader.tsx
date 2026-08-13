"use client";

import { IconRotate, IconSparkles } from "@tabler/icons-react";

interface CourtManagementHeaderProps {
  onAutoAssign: () => void;
  onResetAll: () => void;
}

/** Header bar above the courts grid with the Auto Assign / Reset actions. */
export default function CourtManagementHeader({
  onAutoAssign,
  onResetAll,
}: CourtManagementHeaderProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-app-border bg-app-bg p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-bold text-app-text-primary">Court Management</h2>
        <p className="text-xs text-app-text-muted">
          Assign players to court slots (2v2). Lower play count is prioritized.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onAutoAssign}
          className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
        >
          <IconSparkles size={13} />
          <span>Auto Assign</span>
        </button>
        <button
          type="button"
          onClick={onResetAll}
          className="flex items-center gap-1.5 rounded-xl border border-app-border bg-app-input px-3 py-1.5 text-xs font-medium text-app-text-secondary transition hover:bg-app-hover hover:text-app-text-primary"
        >
          <IconRotate size={13} />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
}
