"use client";

import Image from "next/image";
import { CheckCircle2, Plus, X } from "lucide-react";
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
                  className="flex items-center justify-between rounded-xl border border-[#232834] bg-[#12151c] px-2.5 py-1.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-gray-700">
                      <Image
                        src="/capybara-avatar.png"
                        alt={playerObj.name}
                        width={28}
                        height={28}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-white">
                        {playerObj.name}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {count}x played
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(courtIndex, team, sIdx)}
                    className="rounded p-1 text-gray-400 transition hover:bg-rose-500/10 hover:text-rose-400"
                    title="Remove player"
                  >
                    <X size={13} />
                  </button>
                </div>
              );
            }

            return (
              <button
                key={sIdx}
                type="button"
                onClick={() => onOpenSlotPicker(courtIndex, team, sIdx)}
                className={`flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#282d38] bg-[#12151c]/60 py-2 text-xs font-medium text-gray-400 transition ${emptyHoverClass}`}
              >
                <Plus size={13} />
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
      className={`flex-col justify-between rounded-2xl border border-[#1a1e26] bg-[#0e1117] p-4 transition-all hover:border-[#28303f] shadow-sm ${
        isActive ? "flex" : "hidden md:flex"
      }`}
    >
      {/* Court Title & Status Header */}
      <div className="mb-3.5 flex items-center justify-between border-b border-[#181d26] pb-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-sm">{court.name}</span>
          <span
            className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              courtStatus === "IN PROGRESS"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-[#141820] text-gray-400 border border-[#232834]"
            }`}
          >
            {courtStatus}
          </span>
        </div>
        <span className="rounded bg-[#141820] px-1.5 py-0.5 text-[10px] font-semibold text-gray-400">
          2v2
        </span>
      </div>

      {/* Team Slots */}
      <div className="space-y-3">
        {renderTeam("teamA")}

        {/* VS Divider */}
        <div className="relative flex items-center justify-center py-0.5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#1a1f28]" />
          </div>
          <span className="relative rounded-full bg-[#141820] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-400 border border-[#222734]">
            VS
          </span>
        </div>

        {renderTeam("teamB")}
      </div>

      {/* Finish Court Button */}
      <div className="mt-4 pt-3 border-t border-[#181d26]">
        <button
          type="button"
          disabled={!courtHasPlayers || isSavingRound}
          onClick={() => onFinishCourt(courtIndex)}
          className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition shadow-sm ${
            courtHasPlayers
              ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
              : "border border-transparent bg-[#141820] text-gray-600 cursor-not-allowed"
          }`}
        >
          <CheckCircle2 size={13} />
          <span>Finish {court.name}</span>
        </button>
      </div>
    </div>
  );
}
