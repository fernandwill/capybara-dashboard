"use client";

import Image from "next/image";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import type { PlayerRecord } from "./EditPlayerModal";

interface PlayerTableRowProps {
  player: PlayerRecord;
  onEdit: (player: PlayerRecord) => void;
  onDelete: (player: PlayerRecord) => void;
}

/** Formats an ISO date as "Jan 5, 2025" or "—". */
function formatDate(isoString?: string | null): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

/** Single row in the historical players table. */
export default function PlayerTableRow({
  player,
  onEdit,
  onDelete,
}: PlayerTableRowProps) {
  return (
    <tr className="transition-colors hover:bg-app-hover/60 group">
      {/* Player Column */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Image
            src="/capybara-avatar.png"
            alt={player.name}
            width={400}
            height={383}
            className="h-9 w-9 shrink-0 rounded-full object-cover border border-app-border shadow-sm"
          />
          <span className="font-semibold text-app-text-primary">{player.name}</span>
        </div>
      </td>

      {/* Total Matches */}
      <td className="px-4 py-3.5 text-center font-medium text-app-text-primary">
        {player.totalMatches ?? 0}
      </td>

      {/* This Year */}
      <td className="px-4 py-3.5 text-center font-semibold text-emerald-400">
        {player.thisYearMatches ?? 0}
      </td>

      {/* Last Played */}
      <td className="px-4 py-3.5 text-app-text-secondary">{formatDate(player.lastPlayed)}</td>

      {/* Actions (Pencil & Trash icons) */}
      <td className="px-5 py-3.5 text-right">
        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit(player)}
            className="rounded-lg p-1.5 text-app-text-muted transition hover:bg-app-hover hover:text-app-text-primary"
            title="Edit player"
          >
            <IconPencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(player)}
            className="rounded-lg p-1.5 text-app-text-muted transition hover:bg-red-500/10 hover:text-red-400"
            title="Delete player"
          >
            <IconTrash size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}
