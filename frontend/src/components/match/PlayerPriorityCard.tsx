"use client";

import Image from "next/image";
import { Crown } from "lucide-react";
import type { PlayerInMatch } from "@/components/match/types";

interface PlayerPriorityCardProps {
  players: PlayerInMatch[];
  sessionPlayCounts: Record<string, number>;
  assignedPlayerIds: Set<string>;
}

/** Ranked list of joined players, lowest play count first. */
export default function PlayerPriorityCard({
  players,
  sessionPlayCounts,
  assignedPlayerIds,
}: PlayerPriorityCardProps) {
  const unassignedCount = players.filter(
    (p) => !assignedPlayerIds.has(p.id)
  ).length;

  return (
    <div className="rounded-2xl border border-[#1a1e26] bg-[#0e1117] p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Player Priority</h3>
          <p className="text-[11px] text-gray-400">
            Fewer plays = higher priority
          </p>
        </div>
        <span className="rounded-md border border-[#232834] bg-[#141820] px-2 py-0.5 text-[10px] font-medium text-emerald-400">
          {unassignedCount} in queue
        </span>
      </div>

      <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1 custom-scrollbar">
        {players.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500">
            No players joined yet. Click below to add players.
          </div>
        ) : (
          players.map((player, idx) => {
            const count =
              sessionPlayCounts[player.id] ?? player.playCount ?? 0;
            const isAssigned = assignedPlayerIds.has(player.id);

            return (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-xl border border-[#1d222d] bg-[#12151c] px-3 py-2 transition hover:border-[#28303f]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-gray-700">
                    <Image
                      src="/capybara-avatar.png"
                      alt={player.name}
                      width={28}
                      height={28}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-white">
                      {player.name}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {count}x played {isAssigned && "• on court"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {idx === 0 && <Crown size={14} className="text-amber-400" />}
                  {idx === 1 && <Crown size={14} className="text-gray-300" />}
                  {idx === 2 && <Crown size={14} className="text-amber-600" />}
                  <span className="text-xs font-bold text-gray-400">
                    {idx + 1}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
