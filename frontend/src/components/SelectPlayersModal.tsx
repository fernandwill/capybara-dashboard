"use client";

import React, { useEffect, useMemo, useState } from "react";
import Modal from "./ui/Modal";
import { Loader2, Plus, Search, Star, User, X } from "lucide-react";
import { authFetch } from "@/lib/authFetch";

export interface PlayerOption {
  id: string;
  name: string;
  playCount?: number;
}

interface SelectPlayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlayerIds: string[];
  onSave: (selectedIds: string[]) => void;
  availablePlayers: PlayerOption[];
  onPlayerCreated?: (newPlayer: PlayerOption) => void;
}

type TabType = "all" | "frequent" | "favorites";

const AVATAR_COLORS = [
  "bg-gradient-to-tr from-blue-600 to-indigo-500",
  "bg-gradient-to-tr from-emerald-600 to-teal-500",
  "bg-gradient-to-tr from-amber-600 to-orange-500",
  "bg-gradient-to-tr from-purple-600 to-pink-500",
  "bg-gradient-to-tr from-cyan-600 to-blue-500",
  "bg-gradient-to-tr from-rose-600 to-red-500",
];

export function getAvatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function SelectPlayersModal({
  isOpen,
  onClose,
  selectedPlayerIds,
  onSave,
  availablePlayers,
  onPlayerCreated,
}: SelectPlayersModalProps) {
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("all");

  // Inline player creation state
  const [newPlayerName, setNewPlayerName] = useState("");
  const [isCreatingPlayer, setIsCreatingPlayer] = useState(false);
  const [playerError, setPlayerError] = useState("");

  // Favorites state (persisted locally)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("capy_favorite_players");
      if (stored) {
        setFavoriteIds(JSON.parse(stored));
      }
    } catch {
      // Ignore local storage errors
    }
  }, []);

  const toggleFavorite = (playerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteIds((prev) => {
      const next = prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId];
      try {
        localStorage.setItem("capy_favorite_players", JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  useEffect(() => {
    if (isOpen) {
      setTempSelectedIds([...selectedPlayerIds]);
      setSearchQuery("");
      setNewPlayerName("");
      setPlayerError("");
      setActiveTab("all");
    }
  }, [isOpen, selectedPlayerIds]);

  const handleTogglePlayer = (id: string) => {
    setTempSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreateNewPlayer = async () => {
    const trimmed = newPlayerName.trim();
    if (!trimmed) return;

    const existing = availablePlayers.find(
      (p) => p.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      setPlayerError("Player already exists in the database.");
      if (!tempSelectedIds.includes(existing.id)) {
        setTempSelectedIds((prev) => [...prev, existing.id]);
      }
      return;
    }

    setIsCreatingPlayer(true);
    setPlayerError("");

    try {
      const res = await authFetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, status: "ACTIVE" }),
      });

      if (res.status === 409) {
        setPlayerError("A player with this name already exists.");
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to create player.");
      }

      const created: PlayerOption = await res.json();
      onPlayerCreated?.(created);
      setTempSelectedIds((prev) => [...prev, created.id]);
      setNewPlayerName("");
      setSearchQuery("");
    } catch (err) {
      console.error(err);
      setPlayerError("Failed to create player. Please try again.");
    } finally {
      setIsCreatingPlayer(false);
    }
  };

  // Filter and sort players based on tab and search
  const displayedPlayers = useMemo(() => {
    let list = [...availablePlayers];

    if (activeTab === "frequent") {
      list = list.sort((a, b) => (b.playCount ?? 0) - (a.playCount ?? 0));
    } else if (activeTab === "favorites") {
      list = list.filter((p) => favoriteIds.includes(p.id));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }

    return list;
  }, [availablePlayers, activeTab, searchQuery, favoriteIds]);

  const handleApply = () => {
    onSave(tempSelectedIds);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Players"
      subtitle="Search and select players to add to this match."
      size="md"
      className="max-w-[480px]"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="text-xs font-semibold text-emerald-400">
            {tempSelectedIds.length} player
            {tempSelectedIds.length === 1 ? "" : "s"} selected
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-gray-800 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white shadow transition hover:bg-blue-500"
            >
              Add {tempSelectedIds.length} Player
              {tempSelectedIds.length === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-3.5">
        {/* Search Bar */}
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#232730] bg-[#0c0e12] py-2 pl-9 pr-8 text-xs text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Tabs: All, Frequently Played, Favorites */}
        <div className="flex rounded-xl bg-[#0c0e12] p-1 border border-[#232730]/60">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
              activeTab === "all"
                ? "bg-blue-600 text-white shadow"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            All ({availablePlayers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("frequent")}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
              activeTab === "frequent"
                ? "bg-blue-600 text-white shadow"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Frequently Played
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("favorites")}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
              activeTab === "favorites"
                ? "bg-blue-600 text-white shadow"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Favorites ({favoriteIds.length})
          </button>
        </div>

        {/* Add New Player Bar (not yet in database) */}
        <div className="rounded-xl border border-[#232730] bg-[#101318] p-2.5">
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            <span>Add New Player to Database</span>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Enter new player name..."
              value={newPlayerName}
              onChange={(e) => {
                setNewPlayerName(e.target.value);
                setPlayerError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateNewPlayer();
                }
              }}
              className="w-full rounded-lg border border-[#232730] bg-[#0c0e12] px-3 py-1.5 text-xs text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
            />
            <button
              type="button"
              disabled={isCreatingPlayer || !newPlayerName.trim()}
              onClick={handleCreateNewPlayer}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isCreatingPlayer ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Plus size={13} />
              )}
              <span>Add</span>
            </button>
          </div>
          {playerError && (
            <p className="mt-1 text-[11px] text-red-400">{playerError}</p>
          )}
        </div>

        {/* Player List */}
        <div className="max-h-[300px] space-y-1 overflow-y-auto pr-1">
          {displayedPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-gray-500">
              <User size={24} className="mb-2 text-gray-600" />
              {searchQuery ? (
                <p>
                  No players matching &ldquo;{searchQuery}&rdquo;. Add them above!
                </p>
              ) : activeTab === "favorites" ? (
                <p>No favorite players yet. Click the star icon to add favorites.</p>
              ) : (
                <p>No players found in database.</p>
              )}
            </div>
          ) : (
            displayedPlayers.map((player) => {
              const isSelected = tempSelectedIds.includes(player.id);
              const isFav = favoriteIds.includes(player.id);
              const gradient = getAvatarGradient(player.name);
              const initials = getInitials(player.name);

              return (
                <div
                  key={player.id}
                  onClick={() => handleTogglePlayer(player.id)}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 transition-colors select-none ${
                    isSelected
                      ? "border-blue-500/60 bg-[#161f30] text-white"
                      : "border-transparent bg-[#0c0e12]/60 text-gray-300 hover:border-[#232730] hover:bg-[#101318]"
                  }`}
                >
                  {/* Left: Checkbox + Avatar + Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleTogglePlayer(player.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-gray-600 bg-[#16191f] text-blue-600 focus:ring-0 cursor-pointer accent-blue-600"
                    />
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ${gradient}`}
                    >
                      {initials}
                    </div>
                    <span className="truncate text-xs font-semibold text-white">
                      {player.name}
                    </span>
                  </div>

                  {/* Right: Star (favorite) + Play count badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(player.id, e)}
                      className={`p-1 transition-colors ${
                        isFav
                          ? "text-amber-400 hover:text-amber-300"
                          : "text-gray-600 hover:text-gray-400"
                      }`}
                      title={isFav ? "Remove favorite" : "Add to favorites"}
                    >
                      <Star
                        size={14}
                        fill={isFav ? "currentColor" : "none"}
                      />
                    </button>
                    {typeof player.playCount === "number" && (
                      <span className="rounded-full bg-[#181d26] px-2.5 py-0.5 text-[11px] font-medium text-gray-400 border border-[#232730]">
                        {player.playCount}x
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
