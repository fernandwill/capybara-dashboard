"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Filter, Loader2, Plus, Search, User, X } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import AddPlayerModal from "@/components/players/AddPlayerModal";
import EditPlayerModal, { PlayerRecord } from "@/components/players/EditPlayerModal";
import DeletePlayerModal from "@/components/players/DeletePlayerModal";
import PlayerStatsCards from "@/components/players/PlayerStatsCards";
import PlayerTableRow from "@/components/players/PlayerTableRow";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayers } from "@/hooks/usePlayers";
import { usePagination } from "@/hooks/usePagination";
import { useRouter } from "next/navigation";

const ITEMS_PER_PAGE = 8;
type SortOption = "name" | "matches" | "recent";

export default function PlayersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const { players, isLoading, fetchPlayers } = usePlayers();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("matches");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<PlayerRecord | null>(null);
  const [deletingPlayer, setDeletingPlayer] = useState<PlayerRecord | null>(null);

  // Redirect if unauthenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [authLoading, user, router]);

  // Only show loading states on the first load; background refetches stay silent
  const isLoadingFirstPass = isLoading && players.length === 0;

  const mostPlayedPlayer = useMemo(() => {
    if (players.length === 0) return null;
    return [...players].sort(
      (a, b) => (b.totalMatches ?? 0) - (a.totalMatches ?? 0)
    )[0];
  }, [players]);

  // Filter & Search & Sort
  const filteredPlayers = useMemo(() => {
    let list = [...players];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.email && p.email.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortBy === "matches") {
      list.sort((a, b) => (b.totalMatches ?? 0) - (a.totalMatches ?? 0));
    } else if (sortBy === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "recent") {
      list.sort((a, b) => {
        const timeA = a.lastPlayed ? new Date(a.lastPlayed).getTime() : 0;
        const timeB = b.lastPlayed ? new Date(b.lastPlayed).getTime() : 0;
        return timeB - timeA;
      });
    }

    return list;
  }, [players, searchQuery, sortBy]);

  // Pagination
  const {
    currentPage,
    goToPage,
    totalPages,
    currentItems: paginatedPlayers,
    visiblePageNumbers,
    startIndex,
    endIndex,
  } = usePagination<PlayerRecord>(filteredPlayers, ITEMS_PER_PAGE);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-app-text-primary sm:text-3xl">
              Historical Players
            </h1>
            <p className="mt-1 text-xs text-app-text-muted sm:text-sm">
              Manage players who have played in your matches.
            </p>
          </div>

          {/* Top Right Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Box */}
            <div className="relative min-w-[220px]">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  goToPage(1);
                }}
                placeholder="Search players..."
                className="w-full rounded-xl border border-app-border bg-app-input py-2 pl-9 pr-8 text-xs text-app-text-primary placeholder:text-app-text-muted focus:border-blue-500 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-app-text-muted hover:text-app-text-primary"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter Dropdown Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium transition ${
                  sortBy !== "matches"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-app-border bg-app-input text-app-text-secondary hover:border-app-border-hover hover:text-app-text-primary"
                }`}
              >
                <Filter size={13} className="text-emerald-400" />
                <span>Sort</span>
              </button>

              {isFilterMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsFilterMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-40 mt-2 w-48 overflow-hidden rounded-xl border border-app-border bg-app-input p-1.5 shadow-2xl text-xs">
                    <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-app-text-muted">
                      Sort Players By
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy("matches");
                        setIsFilterMenuOpen(false);
                      }}
                      className={`flex w-full items-center rounded-lg px-2.5 py-1.5 transition ${
                        sortBy === "matches"
                          ? "bg-blue-600 text-white font-medium"
                          : "text-app-text-muted hover:bg-app-hover hover:text-app-text-primary"
                      }`}
                    >
                      Most Matches Played
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy("recent");
                        setIsFilterMenuOpen(false);
                      }}
                      className={`flex w-full items-center rounded-lg px-2.5 py-1.5 transition ${
                        sortBy === "recent"
                          ? "bg-blue-600 text-white font-medium"
                          : "text-app-text-muted hover:bg-app-hover hover:text-app-text-primary"
                      }`}
                    >
                      Recently Played
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy("name");
                        setIsFilterMenuOpen(false);
                      }}
                      className={`flex w-full items-center rounded-lg px-2.5 py-1.5 transition ${
                        sortBy === "name"
                          ? "bg-blue-600 text-white font-medium"
                          : "text-app-text-muted hover:bg-app-hover hover:text-app-text-primary"
                      }`}
                    >
                      Alphabetical (A-Z)
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Add Player Button */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-blue-500"
            >
              <Plus size={14} />
              <span>Add Player</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
      <PlayerStatsCards players={players} isLoading={isLoadingFirstPass} />

        {/* Players Table Card */}
        <div className="overflow-hidden rounded-2xl border border-app-border bg-app-bg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-app-border text-[11px] font-semibold uppercase tracking-wider text-app-text-muted">
                  <th className="px-5 py-3.5">Player</th>
                  <th className="px-4 py-3.5 text-center">Total Matches</th>
                  <th className="px-4 py-3.5 text-center">This Year</th>
                  <th className="px-4 py-3.5">Last Played</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border/60">
                {isLoadingFirstPass ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-app-text-muted">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        <span>Loading historical players...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-app-text-muted">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <User className="h-8 w-8 text-app-text-muted" />
                        <p className="font-medium text-app-text-secondary">No players found</p>
                        <p className="text-xs text-app-text-muted">
                          {searchQuery
                            ? `No results match "${searchQuery}"`
                            : "Click '+ Add Player' to add your first player."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedPlayers.map((player) => (
                    <PlayerTableRow
                      key={player.id}
                      player={player}
                      isTopPlayer={
                        !!mostPlayedPlayer &&
                        mostPlayedPlayer.id === player.id &&
                        (player.totalMatches ?? 0) > 0
                      }
                      onEdit={setEditingPlayer}
                      onDelete={setDeletingPlayer}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer & Compact 5-Page Pagination */}
          <div className="flex flex-col items-center justify-between gap-3 border-t border-app-border px-5 py-3.5 text-xs sm:flex-row">
            <span className="text-app-text-muted">
              Showing {startIndex} to {endIndex} of {filteredPlayers.length} players
            </span>

            {/* Compact Max 5-Button Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => goToPage(currentPage - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-app-border bg-app-input text-app-text-muted transition hover:text-app-text-primary disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={14} />
                </button>

                {visiblePageNumbers.map((pageNum) => {
                  const isCurrent = currentPage === pageNum;

                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => goToPage(pageNum)}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition ${
                        isCurrent
                          ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold"
                          : "border border-app-border bg-app-input text-app-text-muted hover:border-app-border-hover hover:text-app-text-primary"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => goToPage(currentPage + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-app-border bg-app-input text-app-text-muted transition hover:text-app-text-primary disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Next page"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Player Modal */}
      <AddPlayerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchPlayers}
      />

      {/* Edit Player Modal */}
      <EditPlayerModal
        isOpen={!!editingPlayer}
        player={editingPlayer}
        onClose={() => setEditingPlayer(null)}
        onSuccess={fetchPlayers}
      />

      {/* Delete Player Modal */}
      <DeletePlayerModal
        isOpen={!!deletingPlayer}
        player={deletingPlayer}
        onClose={() => setDeletingPlayer(null)}
        onSuccess={fetchPlayers}
      />
    </AppLayout>
  );
}
