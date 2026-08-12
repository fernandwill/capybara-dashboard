"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import AddPlayerModal from "@/components/players/AddPlayerModal";
import EditPlayerModal, { PlayerRecord } from "@/components/players/EditPlayerModal";
import DeletePlayerModal from "@/components/players/DeletePlayerModal";
import { authFetch } from "@/lib/authFetch";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";
import { useRouter } from "next/navigation";

const ITEMS_PER_PAGE = 8;
type SortOption = "name" | "matches" | "recent";

export default function PlayersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("matches");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<PlayerRecord | null>(null);
  const [deletingPlayer, setDeletingPlayer] = useState<PlayerRecord | null>(null);

  // Fetch players from API
  const fetchPlayers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await authFetch("/api/players");
      if (res.ok) {
        const data = await res.json();
        setPlayers(data);
      }
    } catch (err) {
      console.error("Error fetching players:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch players once, when the user becomes authenticated. Do NOT depend on
  // the `user` object identity: Supabase fires auth events (e.g. token refresh)
  // which change it, and that previously triggered a refetch every time.
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!authLoading && user && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      void fetchPlayers();
    }
  }, [user, authLoading, fetchPlayers]);

  // Redirect if unauthenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [authLoading, user, router]);

  // Real-time refresh: refetch silently whenever player data changes
  const refreshFromRealtime = useCallback(() => {
    void fetchPlayers();
  }, [fetchPlayers]);
  useRealtimeRefresh(refreshFromRealtime);

  // Only show loading states on the first load; background refetches stay silent
  const isLoadingFirstPass = isLoading && players.length === 0;

  const currentYear = new Date().getFullYear();

  // Metrics computation
  const totalPlayersCount = players.length;

  const matchesThisYearCount = useMemo(() => {
    return players.reduce((sum, p) => sum + (p.thisYearMatches ?? 0), 0);
  }, [players]);

  const mostPlayedPlayer = useMemo(() => {
    if (players.length === 0) return null;
    return [...players].sort((a, b) => (b.totalMatches ?? 0) - (a.totalMatches ?? 0))[0];
  }, [players]);

  const lastAddedPlayer = useMemo(() => {
    if (players.length === 0) return null;
    return [...players].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    })[0];
  }, [players]);

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return "Recently";
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Added today";
    if (diffDays === 1) return "Added yesterday";
    if (diffDays < 30) return `Added ${diffDays} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return `Added ${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
  };

  const formatDate = (isoString?: string | null) => {
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
  };

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
  const totalPages = Math.max(1, Math.ceil(filteredPlayers.length / ITEMS_PER_PAGE));
  const paginatedPlayers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPlayers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPlayers, currentPage]);

  const startIndex = filteredPlayers.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, filteredPlayers.length);

  // Compact 5-button sliding window pagination
  const visiblePageNumbers = useMemo<number[]>(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let start = Math.max(1, currentPage - 2);
    let end = start + 4;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - 4);
    }

    const pages: number[] = [];
    for (let p = start; p <= end; p++) {
      pages.push(p);
    }
    return pages;
  }, [totalPages, currentPage]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Historical Players
            </h1>
            <p className="mt-1 text-xs text-gray-400 sm:text-sm">
              Manage players who have played in your matches.
            </p>
          </div>

          {/* Top Right Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Box */}
            <div className="relative min-w-[220px]">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search players..."
                className="w-full rounded-xl border border-[#232730] bg-[#101318] py-2 pl-9 pr-8 text-xs text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
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

            {/* Filter Dropdown Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium transition ${
                  sortBy !== "matches"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-[#232730] bg-[#101318] text-gray-300 hover:border-gray-700 hover:text-white"
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
                  <div className="absolute right-0 top-full z-40 mt-2 w-48 overflow-hidden rounded-xl border border-[#232730] bg-[#101318] p-1.5 shadow-2xl text-xs">
                    <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
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
                          : "text-gray-400 hover:bg-[#181d26] hover:text-white"
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
                          : "text-gray-400 hover:bg-[#181d26] hover:text-white"
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
                          : "text-gray-400 hover:bg-[#181d26] hover:text-white"
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
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Players */}
          <div className="rounded-2xl border border-[#1a1e26] bg-[#0c0e12] p-4">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                <Users size={18} />
              </div>
              <span className="text-[11px] font-medium text-gray-400">
                Total Players
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight text-white">
                {isLoadingFirstPass ? "-" : totalPlayersCount}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">All time players</p>
            </div>
          </div>

          {/* Card 2: Matches This Year */}
          <div className="rounded-2xl border border-[#1a1e26] bg-[#0c0e12] p-4">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                <CalendarDays size={18} />
              </div>
              <span className="text-[11px] font-medium text-gray-400">
                Matches in {currentYear}
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight text-white">
                {isLoadingFirstPass ? "-" : matchesThisYearCount}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">Total player appearances</p>
            </div>
          </div>

          {/* Card 3: Most Played */}
          <div className="rounded-2xl border border-[#1a1e26] bg-[#0c0e12] p-4">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-400">
                <Star size={18} />
              </div>
              <span className="text-[11px] font-medium text-gray-400">
                Most Played
              </span>
            </div>
            <div className="mt-3">
              <p className="truncate text-xl font-bold tracking-tight text-white">
                {isLoadingFirstPass ? "-" : mostPlayedPlayer ? mostPlayedPlayer.name : "None"}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                {mostPlayedPlayer ? `${mostPlayedPlayer.totalMatches ?? 0} matches` : "0 matches"}
              </p>
            </div>
          </div>

          {/* Card 4: Last Added */}
          <div className="rounded-2xl border border-[#1a1e26] bg-[#0c0e12] p-4">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
                <Calendar size={18} />
              </div>
              <span className="text-[11px] font-medium text-gray-400">
                Last Added
              </span>
            </div>
            <div className="mt-3">
              <p className="truncate text-xl font-bold tracking-tight text-white">
                {isLoadingFirstPass ? "-" : lastAddedPlayer ? lastAddedPlayer.name : "None"}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                {lastAddedPlayer ? formatRelativeTime(lastAddedPlayer.createdAt) : "No players yet"}
              </p>
            </div>
          </div>
        </div>

        {/* Players Table Card */}
        <div className="overflow-hidden rounded-2xl border border-[#1a1e26] bg-[#0c0e12]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1a1e26] text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3.5">Player</th>
                  <th className="px-4 py-3.5 text-center">Total Matches</th>
                  <th className="px-4 py-3.5 text-center">This Year</th>
                  <th className="px-4 py-3.5">Last Played</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1e26]/60">
                {isLoadingFirstPass ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        <span>Loading historical players...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <User className="h-8 w-8 text-gray-600" />
                        <p className="font-medium text-gray-300">No players found</p>
                        <p className="text-xs text-gray-500">
                          {searchQuery
                            ? `No results match "${searchQuery}"`
                            : "Click '+ Add Player' to add your first player."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedPlayers.map((player) => {
                    const isTopPlayer =
                      mostPlayedPlayer &&
                      mostPlayedPlayer.id === player.id &&
                      (player.totalMatches ?? 0) > 0;

                    return (
                      <tr
                        key={player.id}
                        className="transition-colors hover:bg-[#12151c]/60 group"
                      >
                        {/* Player Column */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Image
                              src="/capybara-avatar.png"
                              alt={player.name}
                              width={400}
                              height={383}
                              className="h-9 w-9 shrink-0 rounded-full object-cover border border-[#232730] shadow-sm"
                            />
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">
                                {player.name}
                              </span>
                              {isTopPlayer && (
                                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                                  Most Played
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Total Matches */}
                        <td className="px-4 py-3.5 text-center font-medium text-white">
                          {player.totalMatches ?? 0}
                        </td>

                        {/* This Year */}
                        <td className="px-4 py-3.5 text-center font-semibold text-emerald-400">
                          {player.thisYearMatches ?? 0}
                        </td>

                        {/* Last Played */}
                        <td className="px-4 py-3.5 text-gray-300">
                          {formatDate(player.lastPlayed)}
                        </td>

                        {/* Actions (Pencil & Trash icons) */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => setEditingPlayer(player)}
                              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-[#1c222e] hover:text-white"
                              title="Edit player"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingPlayer(player)}
                              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-500/10 hover:text-red-400"
                              title="Delete player"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer & Compact 5-Page Pagination */}
          <div className="flex flex-col items-center justify-between gap-3 border-t border-[#1a1e26] px-5 py-3.5 text-xs sm:flex-row">
            <span className="text-gray-400">
              Showing {startIndex} to {endIndex} of {filteredPlayers.length} players
            </span>

            {/* Compact Max 5-Button Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#232730] bg-[#101318] text-gray-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
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
                      onClick={() => setCurrentPage(pageNum)}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition ${
                        isCurrent
                          ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold"
                          : "border border-[#232730] bg-[#101318] text-gray-400 hover:border-gray-700 hover:text-white"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#232730] bg-[#101318] text-gray-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
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
