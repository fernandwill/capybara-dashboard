"use client";

import { RotateCcw, Sparkles } from "lucide-react";

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
    <div className="flex flex-col gap-3 rounded-2xl border border-[#1a1e26] bg-[#0e1117] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-bold text-white">Court Management</h2>
        <p className="text-xs text-gray-400">
          Assign players to court slots (2v2). Lower play count is prioritized.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onAutoAssign}
          className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
        >
          <Sparkles size={13} />
          <span>Auto Assign</span>
        </button>
        <button
          type="button"
          onClick={onResetAll}
          className="flex items-center gap-1.5 rounded-xl border border-[#232834] bg-[#141820] px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-[#1a202c] hover:text-white"
        >
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
}
