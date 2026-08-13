"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconCalendarEvent,
  IconChevronLeft,
  IconChevronRight,
  IconHistory,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useMatches } from "@/hooks/use-matches";
import { usePagination } from "@/hooks/use-pagination";
import { Match, ModalState, SortOption } from "@/types/types";
import { sortMatches } from "@/utils/match-utils";
import CustomDropdown, { DropdownOption } from "@/components/ui/CustomDropdown";
import MatchCard from "@/components/match/MatchCard";
import AppLayout from "@/components/layout/AppLayout";

const SORT_OPTIONS: DropdownOption<SortOption>[] = [
  { value: "date-latest", label: "Date: Newest First" },
  { value: "date-earliest", label: "Date: Oldest First" },
  { value: "fee-high", label: "Fee: Highest First" },
  { value: "fee-low", label: "Fee: Lowest First" },
];

// Modals
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
    createMatch,
    updateMatch,
    deleteMatch,
  } = useMatches();

  // Search, Filter & Pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [sortOption, setSortOption] = useState<SortOption>("date-latest");

  // Modals state
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
  const {
    currentPage,
    goToPage,
    totalPages,
    currentItems: currentMatches,
    visiblePageNumbers,
    startIndex,
    endIndex,
  } = usePagination<Match>(filteredMatches, MATCHES_PER_PAGE);

  // Only show skeletons on the very first load; keep showing stale data
  // during background/realtime refetches so the grid never flashes blank.
  const isLoadingFirstPass = isMatchesLoading && matches.length === 0;

  // Reset page to 1 when filters or search change
  const handleFilterChange = (status: FilterStatus) => {
    setStatusFilter(status);
    goToPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    goToPage(1);
  };

  // Modal Handlers
  const handleMatchClick = (match: Match) => {
    router.push(`/matches/${match.id}`);
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
      // createMatch/updateMatch optimistically update the shared SWR cache;
      // realtime revalidates on the write — no explicit refetch needed here.

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
    <AppLayout
      headerActions={
        <Button
          variant="primary"
          size="sm"
          onClick={handleNewMatch}
          className="flex items-center gap-1.5 font-semibold"
        >
          <IconPlus size={15} />
          <span className="hidden sm:inline">New Match</span>
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Header Section */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm font-medium text-app-primary">
                <IconHistory size={16} />
                <span>Match Archive</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-app-text-primary">
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
                  statusFilter === "COMPLETED" ? "" : "text-app-text-secondary hover:text-app-text-primary"
                }`}
                onClick={() => handleFilterChange("COMPLETED")}
              >
                Completed ({completedCount})
              </Button>
              <Button
                variant={statusFilter === "UPCOMING" ? "primary" : "secondary"}
                size="xs"
                className={`font-semibold ${
                  statusFilter === "UPCOMING" ? "bg-app-primary hover:bg-app-primary-hover" : "text-app-text-secondary hover:text-app-text-primary"
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
              <IconSearch
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
              <CustomDropdown<SortOption>
                options={SORT_OPTIONS}
                value={sortOption}
                onChange={(val) => setSortOption(val)}
                size="sm"
                className="w-48"
              />
            </div>
          </div>

          {/* 3x3 Grid of Match Cards */}
          {isLoadingFirstPass ? (
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
              <IconCalendarEvent size={48} className="mb-3 text-app-text-muted" strokeWidth={1.5} />
              <h3 className="text-lg font-semibold text-app-text-primary">No matches found</h3>
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
              {currentMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onClick={handleMatchClick}
                  onOpenMenu={openRowMenu}
                />
              ))}
            </div>
          )}

          {/* Pagination Controls (9 items per page) */}
          {totalPages > 1 && (
            <div className="mt-4 flex flex-col items-center justify-between gap-4 border-t border-app-border pt-6 sm:flex-row">
              <p className="text-xs text-app-text-muted">
                Showing{" "}
                <span className="font-medium text-app-text-primary">{startIndex}</span>{" "}
                to{" "}
                <span className="font-medium text-app-text-primary">{endIndex}</span>{" "}
                of <span className="font-medium text-app-text-primary">{filteredMatches.length}</span> matches
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => goToPage(currentPage - 1)}
                >
                  <IconChevronLeft size={14} />
                  <span>Previous</span>
                </Button>

                <div className="flex items-center gap-1">
                  {visiblePageNumbers.map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "primary" : "secondary"}
                      size="icon"
                      className={`text-xs font-semibold ${
                        currentPage === pageNum ? "" : "text-app-text-secondary hover:text-app-text-primary"
                      }`}
                      onClick={() => goToPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => goToPage(currentPage + 1)}
                >
                  <span>Next</span>
                  <IconChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>

      {/* Row Menu */}
      <MatchRowMenu
        menu={menu}
        onClose={closeRowMenu}
        onDetails={handleMatchClick}
        onEdit={handleEditMatch}
        onDelete={handleRequestDeleteMatch}
      />

      {/* Match Modals */}
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
    </AppLayout>
  );
}
