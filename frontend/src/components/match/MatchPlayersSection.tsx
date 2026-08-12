"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Plus, UserPlus, X } from "lucide-react";
import SelectPlayersModal, { PlayerOption } from "../SelectPlayersModal";
import type { Match } from "@/types/types";

interface MatchPlayersSectionProps {
  playerIds: string[];
  availablePlayers: PlayerOption[];
  isLoadingPlayers: boolean;
  editingMatch?: Match | null;
  onChange: (playerIds: string[]) => void;
  onPlayerCreated: (newPlayer: PlayerOption) => void;
}

/**
 * The PLAYERS section of the create/edit match form: the empty state with an
 * "Add Players" CTA, the selected-player chips with quick removal, and the
 * "Add More" action. Owns the player picker modal and the selection state.
 */
export default function MatchPlayersSection({
  playerIds,
  availablePlayers,
  isLoadingPlayers,
  editingMatch,
  onChange,
  onPlayerCreated,
}: MatchPlayersSectionProps) {
  const [isPlayerPickerOpen, setIsPlayerPickerOpen] = useState(false);

  const selectedPlayersList = useMemo(() => {
    return playerIds
      .map((id) => availablePlayers.find((p) => p.id === id))
      .filter((p): p is PlayerOption => Boolean(p));
  }, [playerIds, availablePlayers]);

  const handleRemovePlayerChip = (playerId: string) => {
    onChange(playerIds.filter((id) => id !== playerId));
  };

  // Completed matches keep their roster frozen — no player edits.
  if (editingMatch?.status?.toUpperCase() === "COMPLETED") {
    return null;
  }

  return (
    <div>
      {playerIds.length === 0 ? (
        /* State 1: Clean empty state with Add Players CTA */
        <div>
          <div className="mb-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              PLAYERS
            </h3>
            <p className="text-xs text-gray-400">Add players to this match.</p>
          </div>

          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#232730] bg-[#0c0e12]/60 p-6 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
              <UserPlus size={20} />
            </div>
            <p className="text-sm font-semibold text-white">
              No players added yet
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              Add players to get started.
            </p>
            <button
              type="button"
              disabled={isLoadingPlayers}
              onClick={() => setIsPlayerPickerOpen(true)}
              className="mt-3.5 flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-400 transition hover:border-blue-500/50 hover:bg-blue-500/20 disabled:opacity-50"
            >
              <Plus size={14} />
              <span>Add Players</span>
            </button>
          </div>
        </div>
      ) : (
        /* State 2: Selected players chips with quick removal and Add More */
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                PLAYERS
              </h3>
              <p className="text-xs font-semibold text-emerald-400">
                {playerIds.length} player{playerIds.length === 1 ? "" : "s"} added
              </p>
            </div>
          </div>

          {/* Chips Grid */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {selectedPlayersList.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-xl border border-[#232730] bg-[#0c0e12] px-3 py-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Image
                    src="/capybara-avatar.png"
                    alt={player.name}
                    width={400}
                    height={383}
                    className="h-7 w-7 shrink-0 rounded-full object-cover border border-gray-700 shadow-sm"
                  />
                  <span className="truncate text-xs font-semibold text-white">
                    {player.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleRemovePlayerChip(player.id)}
                    className="rounded p-1 text-gray-400 transition hover:bg-gray-800 hover:text-white"
                    aria-label={`Remove ${player.name}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add More Button */}
          <button
            type="button"
            onClick={() => setIsPlayerPickerOpen(true)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/5 py-2 text-xs font-semibold text-blue-400 transition hover:border-blue-500/50 hover:bg-blue-500/15"
          >
            <Plus size={14} />
            <span>+ Add More Players</span>
          </button>
        </div>
      )}

      {/* State 3: Player Picker Modal with Search, Tabs, Favorites, and New Player creation */}
      <SelectPlayersModal
        isOpen={isPlayerPickerOpen}
        onClose={() => setIsPlayerPickerOpen(false)}
        selectedPlayerIds={playerIds}
        onSave={(newSelectedIds) => {
          onChange(newSelectedIds);
        }}
        availablePlayers={availablePlayers}
        onPlayerCreated={onPlayerCreated}
      />
    </div>
  );
}
