"use client";

import Image from "next/image";
import { IconCircleCheck, IconPlus, IconX } from "@tabler/icons-react";
import type { CourtState } from "@/hooks/useCourtManager";
import type { PlayerInMatch } from "@/components/match/types";

interface CourtCardProps {
  court: CourtState;
  courtIndex: number;
  isActive: boolean;
  players: PlayerInMatch[];
  sessionPlayCounts: Record<string, number>;
  isSavingRound: boolean;
  onRemove: (
    courtIndex: number,
    team: "teamA" | "teamB",
    slotIndex: number
  ) => void;
  onOpenSlotPicker: (
    courtIndex: number,
    team: "teamA" | "teamB",
    slotIndex: number
  ) => void;
  onFinishCourt: (courtIndex: number) => void;
}

/** A single 2v2 court card: two teams of two slots, VS divider, finish button. */
export default function CourtCard({
  court,
  courtIndex,
  isActive,
  players,
  sessionPlayCounts,
  isSavingRound,
  onRemove,
  onOpenSlotPicker,
  onFinishCourt,
}: CourtCardProps) {
  const courtHasPlayers =
    court.teamA.some((s) => s.playerId) || court.teamB.some((s) => s.playerId);
  const courtStatus = courtHasPlayers ? "IN PROGRESS" : "EMPTY";

  const renderTeam = (team: "teamA" | "teamB") => {
    const teamLabel = team === "teamA" ? "Team A" : "Team B";
    const labelClass =
      team === "teamA"
        ? "text-emerald-400"
        : "text-blue-400";
    const emptyHoverClass =
      team === "teamA"
        ? "hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:text-emerald-300"
        : "hover:border-blue-500/50 hover:bg-blue-500/5 hover:text-blue-300";

    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span
            className={`text-[11px] font-bold uppercase tracking-wider ${labelClass}`}
          >
            {teamLabel}
          </span>
        </div>
        <div className="space-y-1.5">
          {court[team].map((slot, sIdx) => {
            const playerObj = players.find((p) => p.id === slot.playerId);
            if (playerObj) {
              const count =
                sessionPlayCounts[playerObj.id] ?? playerObj.playCount ?? 0;
              return (
                <div
                  key={sIdx}
                  className="flex items-center justify-between rounded-xl border border-app-border bg-app-input px-2.5 py-1.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-app-border">
                      <Image
                        src="/capybara-avatar.png"
                        alt={playerObj.name}
                        width={28}
                        height={28}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-app-text-primary">
                        {playerObj.name}
                      </p>
                      <p className="text-[10px] text-app-text-muted">
                        {count}x played
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(courtIndex, team, sIdx)}
                    className="flex min-h-8 min-w-8 items-center justify-center rounded-lg text-app-text-muted transition hover:bg-rose-500/10 hover:text-rose-400"
                    title="Remove player"
                    aria-label="Remove player"
                  >
                    <IconX size={14} />
                  </button>
                </div>
              );
            }

            return (
              <button
                key={sIdx}
                type="button"
                onClick={() => onOpenSlotPicker(courtIndex, team, sIdx)}
                className={`flex w-full min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-dashed border-app-border bg-app-input/60 py-2.5 text-xs font-medium text-app-text-muted transition ${emptyHoverClass}`}
              >
                <IconPlus size={14} />
                <span>Add player</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`flex-col justify-between rounded-2xl border border-app-border bg-app-bg p-4 transition-all hover:border-app-border-hover shadow-sm ${
        isActive ? "flex" : "hidden md:flex"
      }`}
    >
      {/* Court Title & Status Header */}
      <div className="mb-3.5 flex items-center justify-between border-b border-app-border pb-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-app-text-primary text-sm">{court.name}</span>
          <span
            className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              courtStatus === "IN PROGRESS"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-app-input text-app-text-muted border border-app-border"
            }`}
          >
            {courtStatus}
          </span>
        </div>
        <span className="rounded bg-app-input px-1.5 py-0.5 text-[10px] font-semibold text-app-text-muted">
          2v2
        </span>
      </div>

      {/* Team Slots */}
      <div className="space-y-3">
        {renderTeam("teamA")}

        {/* VS Divider */}
        <div className="relative flex items-center justify-center py-0.5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-app-border" />
          </div>
          <span className="relative rounded-full bg-app-input px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-app-text-muted border border-app-border">
            VS
          </span>
        </div>

        {renderTeam("teamB")}
      </div>

      {/* Finish Court Button */}
      <div className="mt-4 pt-3 border-t border-app-border">
        <button
          type="button"
          disabled={!courtHasPlayers || isSavingRound}
          onClick={() => onFinishCourt(courtIndex)}
          className={`flex w-full min-h-[42px] items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition shadow-sm ${
            courtHasPlayers
              ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 active:scale-[0.99]"
              : "border border-transparent bg-app-input text-app-text-muted cursor-not-allowed"
          }`}
        >
          <IconCircleCheck size={14} />
          <span>Finish {court.name}</span>
        </button>
      </div>
    </div>
  );
}
