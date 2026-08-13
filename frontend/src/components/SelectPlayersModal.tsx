"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Modal from "./ui/Modal";
import { IconLoader, IconPlus, IconSearch, IconStar, IconUser, IconX } from "@tabler/icons-react";
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
  onSave: (selectedIds: string[]) => Promise<void> | void;
  availablePlayers: PlayerOption[];
  onPlayerCreated?: (newPlayer: PlayerOption) => void;
}

type TabType = "all" | "frequent" | "favorites";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Track whether the modal is open so the selection is initialized only on
  // the open transition. Parents may re-render (e.g. background dashboard
  // refreshes) and pass a new `selectedPlayerIds` array identity while the
  // modal is open — we must not wipe the user's in-progress selection then.
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setTempSelectedIds([...selectedPlayerIds]);
      setSearchQuery("");
      setNewPlayerName("");
      setPlayerError("");
      setActiveTab("all");
      setIsSubmitting(false);
    }
    wasOpenRef.current = isOpen;
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

  // Only count players newly checked relative to the initial selection
  // (players already in the match are pre-selected and shouldn't count as "added").
  const newlySelectedCount = tempSelectedIds.filter(
    (id) => !selectedPlayerIds.includes(id)
  ).length;
  const removedCount = selectedPlayerIds.filter(
    (id) => !tempSelectedIds.includes(id)
  ).length;
  const hasSelectionChanges = newlySelectedCount > 0 || removedCount > 0;

  const handleApply = async () => {
    try {
      setIsSubmitting(true);
      await onSave(tempSelectedIds);
      onClose();
    } catch (error) {
      console.error("Error applying player selection:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title="Select Players"
      subtitle="Search and select players to add to this match."
      size="md"
      className="max-w-[480px]"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="text-xs font-semibold text-emerald-400">
            {newlySelectedCount} player
            {newlySelectedCount === 1 ? "" : "s"} selected
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-app-text-secondary transition hover:bg-app-hover hover:text-app-text-primary disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!hasSelectionChanges || isSubmitting}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white shadow transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <IconLoader size={13} className="animate-spin" />
                  <span>
                    {removedCount > 0 && newlySelectedCount === 0
                      ? "Saving Changes..."
                      : "Adding Players..."}
                  </span>
                </>
              ) : removedCount > 0 && newlySelectedCount === 0 ? (
                "Save Changes"
              ) : (
                `Add ${newlySelectedCount} Player${newlySelectedCount === 1 ? "" : "s"}`
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-3.5">
        {/* Search Bar */}
        <div className="relative">
          <IconSearch
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted"
          />
          <input
            type="text"
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-app-border bg-app-input py-2 pl-9 pr-8 text-xs text-app-text-primary placeholder:text-app-text-muted focus:border-blue-500 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-app-text-muted hover:text-app-text-primary"
            >
              <IconX size={13} />
            </button>
          )}
        </div>

        {/* Tabs: All, Frequently Played, Favorites */}
        <div className="flex rounded-xl bg-app-input p-1 border border-app-border/60">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
              activeTab === "all"
                ? "bg-blue-600 text-white shadow"
                : "text-app-text-muted hover:text-app-text-primary"
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
                : "text-app-text-muted hover:text-app-text-primary"
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
                : "text-app-text-muted hover:text-app-text-primary"
            }`}
          >
            Favorites ({favoriteIds.length})
          </button>
        </div>

        {/* Add New Player Bar (not yet in database) */}
        <div className="rounded-xl border border-app-border bg-app-input p-2.5">
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-app-text-muted">
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
              className="w-full rounded-lg border border-app-border bg-app-input px-3 py-1.5 text-xs text-app-text-primary placeholder:text-app-text-muted focus:border-blue-500 focus:outline-none transition-colors"
            />
            <button
              type="button"
              disabled={isCreatingPlayer || !newPlayerName.trim()}
              onClick={handleCreateNewPlayer}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isCreatingPlayer ? (
                <IconLoader size={13} className="animate-spin" />
              ) : (
                <IconPlus size={13} />
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
            <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-app-text-muted">
              <IconUser size={24} className="mb-2 text-app-text-muted" />
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

              return (
                <div
                  key={player.id}
                  onClick={() => handleTogglePlayer(player.id)}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 transition-colors select-none ${
                    isSelected
                      ? "border-blue-500/60 bg-app-selected text-app-text-primary"
                      : "border-transparent bg-app-input/60 text-app-text-secondary hover:border-app-border hover:bg-app-hover"
                  }`}
                >
                  {/* Left: Checkbox + Avatar + Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleTogglePlayer(player.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-app-border bg-app-input text-blue-600 focus:ring-0 cursor-pointer accent-blue-600"
                    />
                    <Image
                      src="/capybara-avatar.png"
                      alt={player.name}
                      width={400}
                      height={383}
                      className="h-8 w-8 shrink-0 rounded-full object-cover border border-app-border shadow-sm"
                    />
                    <span className="truncate text-xs font-semibold text-app-text-primary">
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
                          : "text-app-text-muted hover:text-app-text-secondary"
                      }`}
                      title={isFav ? "Remove favorite" : "Add to favorites"}
                    >
                      <IconStar
                        size={14}
                        fill={isFav ? "currentColor" : "none"}
                      />
                    </button>
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
