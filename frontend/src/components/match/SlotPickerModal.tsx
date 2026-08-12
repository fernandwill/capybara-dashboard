"use client";

import Image from "next/image";
import { X } from "lucide-react";
import type { PlayerInMatch } from "@/components/match/types";

export interface SlotPickerState {
  courtIndex: number;
  team: "teamA" | "teamB";
  slotIndex: number;
}

interface SlotPickerModalProps {
  slotPicker: SlotPickerState | null;
  unassignedPlayers: PlayerInMatch[];
  sessionPlayCounts: Record<string, number>;
  onClose: () => void;
  onSelect: (
    courtIndex: number,
    team: "teamA" | "teamB",
    slotIndex: number,
    playerId: string
  ) => void;
}

/** Overlay listing unassigned players to fill a specific court slot. */
export default function SlotPickerModal({
  slotPicker,
  unassignedPlayers,
  sessionPlayCounts,
  onClose,
  onSelect,
}: SlotPickerModalProps) {
  if (!slotPicker) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-2xl border border-[#232834] bg-[#0e1117] p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-white">Select Player</h4>
            <p className="text-xs text-gray-400">
              Choose from unassigned players in queue
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-64 space-y-1 overflow-y-auto pr-1 custom-scrollbar">
          {unassignedPlayers.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-400">
              <p>All joined players are currently assigned.</p>
            </div>
          ) : (
            unassignedPlayers.map((player) => {
              const count =
                sessionPlayCounts[player.id] ?? player.playCount ?? 0;
              return (
                <button
                  key={player.id}
                  type="button"
                  onClick={() =>
                    onSelect(
                      slotPicker.courtIndex,
                      slotPicker.team,
                      slotPicker.slotIndex,
                      player.id
                    )
                  }
                  className="flex w-full items-center justify-between rounded-xl border border-transparent bg-[#12151c] px-3 py-2 text-left transition hover:border-emerald-500/50 hover:bg-[#16202e]"
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
                    <span className="truncate text-xs font-semibold text-white">
                      {player.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-400">
                    {count}x played
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
