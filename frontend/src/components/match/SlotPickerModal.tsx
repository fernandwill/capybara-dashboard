"use client";

import Image from "next/image";
import { IconX } from "@tabler/icons-react";
import type { PlayerInMatch } from "@/types/match-types";

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full h-auto max-h-[85vh] max-w-sm rounded-2xl border border-app-border bg-app-bg p-5 shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-app-text-primary">Select Player</h4>
            <p className="text-xs text-app-text-muted">
              Choose from unassigned players in queue
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-8 min-w-8 items-center justify-center rounded-lg text-app-text-muted hover:text-app-text-primary"
          >
            <IconX size={16} />
          </button>
        </div>

        <div className="flex-1 sm:max-h-64 space-y-1 overflow-y-auto pr-1 custom-scrollbar">
          {unassignedPlayers.length === 0 ? (
            <div className="py-6 text-center text-xs text-app-text-muted">
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
                  className="flex w-full items-center justify-between rounded-xl border border-transparent bg-app-input px-3 py-2 text-left transition hover:border-emerald-500/50 hover:bg-app-hover"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-app-border">
                      <Image
                        src="/capybara-avatar.png"
                        alt={player.name}
                        width={28}
                        height={28}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="truncate text-xs font-semibold text-app-text-primary">
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
