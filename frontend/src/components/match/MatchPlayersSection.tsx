"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { IconAlertTriangle, IconPlus, IconUserPlus, IconX } from "@tabler/icons-react";
import SelectPlayersModal, { PlayerOption } from "../SelectPlayersModal";
import type { Match } from "@/types/types";

interface MatchPlayersSectionProps {
  playerIds: string[];
  availablePlayers: PlayerOption[];
  isLoadingPlayers: boolean;
  playersError?: string | null;
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
  playersError,
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
      {playersError && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
          <IconAlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{playersError}</span>
        </div>
      )}

      {playerIds.length === 0 ? (
        /* State 1: Clean empty state with Add Players CTA */
        <div>
          <div className="mb-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-app-text-muted">
              PLAYERS
            </h3>
            <p className="text-xs text-app-text-muted">Add players to this match.</p>
          </div>

          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-app-border bg-app-input/60 p-6 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
              <IconUserPlus size={20} />
            </div>
            <p className="text-sm font-semibold text-app-text-primary">
              No players added yet
            </p>
            <p className="mt-0.5 text-xs text-app-text-muted">
              Add players to get started.
            </p>
            <button
              type="button"
              disabled={isLoadingPlayers}
              onClick={() => setIsPlayerPickerOpen(true)}
              className="mt-3.5 flex items-center gap-1.5 rounded-lg border border-app-primary/30 bg-app-primary/10 px-4 py-1.5 text-xs font-semibold text-app-primary transition hover:border-app-primary/50 hover:bg-app-primary/20 disabled:opacity-50"
            >
              <IconPlus size={14} />
              <span>Add Players</span>
            </button>
          </div>
        </div>
      ) : (
        /* State 2: Selected players chips with quick removal and Add More */
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-app-text-muted">
                PLAYERS
              </h3>
              <p className="text-xs font-semibold text-emerald-400">
                {playerIds.length} player{playerIds.length === 1 ? "" : "s"} added
              </p>
            </div>
          </div>

          {/* Chips Grid (2x2 grid) */}
          <div className="grid grid-cols-2 gap-2">
            {selectedPlayersList.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-xl border border-app-border bg-app-input px-2.5 py-1.5 min-w-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Image
                    src="/capybara-avatar.png"
                    alt={player.name}
                    width={400}
                    height={383}
                    className="h-6 w-6 shrink-0 rounded-full object-cover border border-app-border shadow-sm"
                  />
                  <span className="truncate text-xs font-semibold text-app-text-primary">
                    {player.name}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleRemovePlayerChip(player.id)}
                    className="rounded p-1 text-app-text-muted transition hover:bg-app-hover hover:text-app-text-primary"
                    aria-label={`Remove ${player.name}`}
                  >
                    <IconX size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add More Button */}
          <button
            type="button"
            onClick={() => setIsPlayerPickerOpen(true)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-app-primary/30 bg-app-primary/5 py-2 text-xs font-semibold text-app-primary transition hover:border-app-primary/50 hover:bg-app-primary/15"
          >
            <IconPlus size={14} />
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
