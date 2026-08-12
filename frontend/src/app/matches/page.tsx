"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  Clock,
  Hash,
  History,
  MapPin,
  MoreVertical,
  Plus,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useMatches } from "@/hooks/useMatches";
import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";
import { Match, ModalState, SortOption } from "@/types/types";
import { formatCurrency, formatDurationHours, formatShortDate } from "@/utils/formatters";
import { sortMatches } from "@/utils/matchUtils";

// Modals
import MatchDetailsModal from "@/components/MatchDetailsModal";
import NewMatchModal from "@/components/NewMatchModal";
import DeleteMatchModal from "@/components/DeleteMatchModal";
import SuccessModal from "@/components/SuccessModal";
import ErrorModal from "@/components/ErrorModal";
import MatchRowMenu from "@/components/dashboard/MatchRowMenu";

const MATCHES_PER_PAGE = 9;
type FilterStatus = "ALL" | "COMPLETED" | "UPCOMING";

export default function AllMatchesHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const {
    matches,
    isLoading: isMatchesLoading,
    fetchMatches,
    createMatch,
    updateMatch,
    deleteMatch,
  } = useMatches();

  // Search, Filter & Pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [sortOption, setSortOption] = useState<SortOption>("date-latest");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [matchPendingDeletion, setMatchPendingDeletion] = useState<Match | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingMatch, setIsDeletingMatch] = useState(false);
  const [isSubmittingMatch, setIsSubmittingMatch] = useState(false);
  const [menu, setMenu] = useState<{ match: Match; x: number; y: number } | null>(null);
  const [successModal, setSuccessModal] = useState<ModalState>({
    isOpen: false,
    title: "",
    message: "",
  });
  const [errorModal, setErrorModal] = useState<ModalState>({
    isOpen: false,
    title: "",
    message: "",
  });

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Fetch matches on mount
  useEffect(() => {
    void fetchMatches();
  }, [fetchMatches]);

  // Real-time refresh: refetch whenever match/player data changes
  const refreshFromRealtime = useCallback(() => {
    void fetchMatches();
  }, [fetchMatches]);
  useRealtimeRefresh(refreshFromRealtime);

  // Redirect if unauthenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [authLoading, user, router]);

  // Filter & Sort logic
  const filteredMatches = useMemo(() => {
    let result = [...matches];

    // Status Filter
    if (statusFilter !== "ALL") {
      result = result.filter((m) => m.status === statusFilter);
    }

    // Search Query (Title or Location)
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.location.toLowerCase().includes(q) ||
          m.courtNumber.toLowerCase().includes(q)
      );
    }

    // Sorting
    return sortMatches(result, sortOption);
  }, [matches, statusFilter, searchQuery, sortOption]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredMatches.length / MATCHES_PER_PAGE));
  const currentMatches = useMemo(() => {
    const startIndex = (currentPage - 1) * MATCHES_PER_PAGE;
    return filteredMatches.slice(startIndex, startIndex + MATCHES_PER_PAGE);
  }, [filteredMatches, currentPage]);

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

  // Reset page to 1 when filters or search change
  const handleFilterChange = (status: FilterStatus) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Modal Handlers
  const handleMatchClick = (match: Match) => {
    router.push(`/matches/${match.id}`);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedMatch(null);
  };

  const handleNewMatch = () => {
    setEditingMatch(null);
    setIsModalOpen(true);
  };

  const handleEditMatch = (match: Match) => {
    setEditingMatch(match);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMatch(null);
  };

  const handleRequestDeleteMatch = (match: Match) => {
    setMatchPendingDeletion(match);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setMatchPendingDeletion(null);
  };

  const handleConfirmDeleteMatch = async () => {
    if (!matchPendingDeletion) return;
    setIsDeletingMatch(true);
    try {
      const success = await deleteMatch(matchPendingDeletion.id);
      if (success) {
        if (selectedMatch?.id === matchPendingDeletion.id) {
          handleCloseDetailsModal();
        }
        await fetchMatches();
        handleCloseDeleteModal();
        setSuccessModal({
          isOpen: true,
          title: "Success!",
          message: "Match deleted successfully!",
        });
      } else {
        throw new Error("Delete failed");
      }
    } catch (err) {
      console.error("Error deleting match:", err);
      setErrorModal({
        isOpen: true,
        title: "Error!",
        message: "Failed to delete match. Please try again.",
      });
    } finally {
      setIsDeletingMatch(false);
    }
  };

  const handleSubmitMatch = async (matchData: {
    title: string;
    location: string;
    courtNumber: string;
    date: string;
    time: string;
    fee: number;
    status: string;
    description?: string;
    playerIds?: string[];
  }) => {
    setIsSubmittingMatch(true);
    try {
      const isEditing = editingMatch !== null;
      const success = isEditing
        ? await updateMatch(editingMatch.id, matchData)
        : await createMatch(matchData);

      if (!success) {
        throw new Error("Operation failed");
      }

      setIsModalOpen(false);
      setEditingMatch(null);
      await fetchMatches();

      setSuccessModal({
        isOpen: true,
        title: "Success!",
        message: `Match ${isEditing ? "updated" : "created"} successfully!`,
      });
    } catch (err) {
      console.error("Error submitting match:", err);
      setErrorModal({
        isOpen: true,
        title: "Error!",
        message: `Failed to ${editingMatch ? "update" : "create"} match. Please try again.`,
      });
    } finally {
      setIsSubmittingMatch(false);
    }
  };

  const openRowMenu = (event: React.MouseEvent<HTMLButtonElement>, match: Match) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 144;
    setMenu({ match, x: Math.max(8, rect.right - menuWidth), y: rect.bottom });
  };

  const closeRowMenu = () => setMenu(null);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg text-app-text-muted">
        Loading...
      </div>
    );
  }

  const completedCount = matches.filter((m) => m.status === "COMPLETED").length;
  const upcomingCount = matches.filter((m) => m.status === "UPCOMING").length;

  return (
    <div className="min-h-screen bg-app-bg text-app-text-primary">
      {/* Navigation Top Bar */}
      <nav className="sticky top-0 z-50 border-b border-app-border bg-app-bg/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Brand and Back Link */}
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 rounded-lg border border-app-border bg-app-card px-3 py-1.5 text-sm font-medium text-app-text-primary transition hover:bg-gray-700 hover:text-white"
              >
                <ArrowLeft size={16} />
                <span>Dashboard</span>
              </Link>
              <div className="h-5 w-px bg-app-border" />
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-gray-700">
                  <Image
                    src="/icons/icon.jpg"
                    alt="Capybara"
                    width={28}
                    height={28}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="font-bold tracking-tight text-white">Capybara</span>
              </div>
            </div>

            {/* Quick Action */}
            <Button variant="primary" onClick={handleNewMatch}>
              <Plus size={16} />
              <span>New Match</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          {/* Header Section */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm font-medium text-app-primary">
                <History size={16} />
                <span>Match Archive</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                All Matches History
              </h1>
              <p className="mt-1 text-sm text-app-text-secondary">
                Viewing {filteredMatches.length} total recorded badminton matches.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={statusFilter === "ALL" ? "primary" : "secondary"}
                size="xs"
                className="font-semibold"
                onClick={() => handleFilterChange("ALL")}
              >
                All ({matches.length})
              </Button>
              <Button
                variant={statusFilter === "COMPLETED" ? "success" : "secondary"}
                size="xs"
                className={`font-semibold ${
                  statusFilter === "COMPLETED" ? "" : "text-app-text-secondary hover:text-white"
                }`}
                onClick={() => handleFilterChange("COMPLETED")}
              >
                Completed ({completedCount})
              </Button>
              <Button
                variant={statusFilter === "UPCOMING" ? "primary" : "secondary"}
                size="xs"
                className={`font-semibold ${
                  statusFilter === "UPCOMING" ? "bg-blue-500 hover:bg-blue-600" : "text-app-text-secondary hover:text-white"
                }`}
                onClick={() => handleFilterChange("UPCOMING")}
              >
                Upcoming ({upcomingCount})
              </Button>
            </div>
          </div>

          {/* Search & Sort Bar */}
          <div className="flex flex-col gap-3 rounded-xl border border-app-border bg-app-card p-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted"
              />
              <input
                type="text"
                placeholder="Search by title, location, or court..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-lg border border-app-border bg-app-bg py-2 pl-9 pr-4 text-sm text-app-text-primary placeholder:text-app-text-muted focus:border-app-primary focus:outline-none"
              />
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-app-text-muted">Sort:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text-primary focus:border-app-primary focus:outline-none"
              >
                <option value="date-latest">Date: Newest First</option>
                <option value="date-earliest">Date: Oldest First</option>
                <option value="fee-high">Fee: Highest First</option>
                <option value="fee-low">Fee: Lowest First</option>
              </select>
            </div>
          </div>

          {/* 3x3 Grid of Match Cards */}
          {isMatchesLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-64 animate-pulse rounded-xl border border-app-border bg-app-card p-5"
                />
              ))}
            </div>
          ) : currentMatches.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-app-border/60 bg-app-card p-8 text-center">
              <CalendarDays size={48} className="mb-3 text-app-text-muted" strokeWidth={1.5} />
              <h3 className="text-lg font-semibold text-white">No matches found</h3>
              <p className="mt-1 max-w-sm text-sm text-app-text-muted">
                {searchQuery || statusFilter !== "ALL"
                  ? "Try adjusting your search query or status filter."
                  : "No matches recorded yet. Create your first match to get started."}
              </p>
              {searchQuery || statusFilter !== "ALL" ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("ALL");
                  }}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-4"
                  onClick={handleNewMatch}
                >
                  + Create Match
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {currentMatches.map((match) => {
                const [day, month] = formatShortDate(match.date).split(" ");
                const isCompleted = match.status === "COMPLETED";

                return (
                  <div
                    key={match.id}
                    onClick={() => handleMatchClick(match)}
                    className="group relative flex flex-col justify-between rounded-xl border border-app-border bg-app-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-600 hover:shadow-lg cursor-pointer"
                  >
                    {/* Top Row: Date Badge, Status Badge, Row Menu */}
                    <div>
                      <div className="mb-4 flex items-start justify-between">
                        {/* Date Badge */}
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg border border-app-border bg-app-bg">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted">
                              {month}
                            </span>
                            <span className="text-base font-bold text-white leading-none">
                              {day}
                            </span>
                          </div>
                          <div>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                isCompleted
                                  ? "border border-app-success/20 bg-app-success-bg text-app-success-text"
                                  : "border border-blue-500/20 bg-blue-500/10 text-blue-400"
                              }`}
                            >
                              {isCompleted ? "Completed" : "Upcoming"}
                            </span>
                          </div>
                        </div>

                        {/* Action Menu */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-app-text-muted hover:bg-gray-700 hover:text-white"
                          onClick={(e) => openRowMenu(e, match)}
                          aria-label={`Actions for ${match.title}`}
                        >
                          <MoreVertical size={16} />
                        </Button>
                      </div>

                      {/* Title & Location */}
                      <h3 className="line-clamp-1 text-lg font-bold text-white transition group-hover:text-app-primary">
                        {match.title}
                      </h3>
                      <p className="mt-1 flex items-center gap-1.5 line-clamp-1 text-sm text-app-text-secondary">
                        <MapPin size={14} className="shrink-0 text-app-text-muted" />
                        <span className="truncate">{match.location}</span>
                      </p>

                      {/* Meta Information Grid */}
                      <div className="mt-4 grid grid-cols-2 gap-2.5 rounded-lg border border-app-border/50 bg-app-bg/50 p-3 text-xs text-app-text-secondary">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-app-text-muted shrink-0" />
                          <span className="truncate">{match.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Hash size={13} className="text-app-text-muted shrink-0" />
                          <span className="truncate">Court {match.courtNumber}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users size={13} className="text-app-text-muted shrink-0" />
                          <span>{match.players?.length || 0} Players</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Banknote size={13} className="text-app-text-muted shrink-0" />
                          <span className="font-semibold text-app-success-text truncate">
                            {formatCurrency(match.fee)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="mt-4 flex items-center justify-between border-t border-app-border/40 pt-3 text-xs">
                      <span className="text-app-text-muted">
                        Duration: {formatDurationHours(match.time)}
                      </span>
                      <span className="font-medium text-app-primary transition group-hover:underline">
                        View Details →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls (9 items per page) */}
          {totalPages > 1 && (
            <div className="mt-4 flex flex-col items-center justify-between gap-4 border-t border-app-border pt-6 sm:flex-row">
              <p className="text-xs text-app-text-muted">
                Showing{" "}
                <span className="font-medium text-white">
                  {(currentPage - 1) * MATCHES_PER_PAGE + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-white">
                  {Math.min(currentPage * MATCHES_PER_PAGE, filteredMatches.length)}
                </span>{" "}
                of <span className="font-medium text-white">{filteredMatches.length}</span> matches
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </Button>

                <div className="flex items-center gap-1">
                  {visiblePageNumbers.map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "primary" : "secondary"}
                      size="icon"
                      className={`text-xs font-semibold ${
                        currentPage === pageNum ? "" : "text-app-text-secondary hover:text-white"
                      }`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Row Menu */}
      <MatchRowMenu
        menu={menu}
        onClose={closeRowMenu}
        onDetails={handleMatchClick}
        onEdit={handleEditMatch}
        onDelete={handleRequestDeleteMatch}
      />

      {/* Match Modals */}
      <MatchDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        match={selectedMatch}
        onMatchUpdate={fetchMatches}
        onEdit={(match) => {
          handleCloseDetailsModal();
          handleEditMatch(match);
        }}
      />

      <NewMatchModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitMatch}
        editingMatch={editingMatch}
        isSubmitting={isSubmittingMatch}
      />

      <DeleteMatchModal
        isOpen={isDeleteModalOpen}
        matchTitle={matchPendingDeletion?.title || ""}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDeleteMatch}
        isLoading={isDeletingMatch}
      />

      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ isOpen: false, title: "", message: "" })}
        title={successModal.title}
        message={successModal.message}
      />

      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, title: "", message: "" })}
        title={errorModal.title}
        message={errorModal.message}
      />
    </div>
  );
}
