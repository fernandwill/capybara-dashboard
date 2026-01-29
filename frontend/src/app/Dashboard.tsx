"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import NewMatchModal from "../components/NewMatchModal";
import SuccessModal from "../components/SuccessModal";
import ErrorModal from "../components/ErrorModal";
import MatchDetailsModal from "../components/MatchDetailsModal";
import DeleteMatchModal from "../components/DeleteMatchModal";
import Image from "next/image";
import StatsChart from "../components/StatsChart";
import { signOut } from "@/lib/authService";
import {
  Loader2,
  LogOut,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check,
  ChevronDown,
  Calendar,
  MapPin,
  Clock,
  Hash,
  Users,
  CheckCircle2,
  AlertCircle,
  Edit2
} from "lucide-react";

// Import shared types and utilities
import { Match, SortOption, ModalState } from "@/types/types";
import { formatDate, formatCurrency, formatTimeWithDuration } from "@/utils/formatters";
import {
  sortMatches,
  filterMatches,
  areAllPlayersPaid,
  getPendingPaymentCount,
  getClosestUpcomingMatch,
} from "@/utils/matchUtils";

// Import custom hooks
import { useStats } from "@/hooks/useStats";
import { useMatches } from "@/hooks/useMatches";
import { useCountdown } from "@/hooks/useCountdown";

// Constants
const AUTO_UPDATE_INTERVAL_MS = 60 * 1000;

export function Dashboard() {
  const { setUser } = useAuth();

  // Data hooks
  const { stats, fetchStats, isLoading: isStatsLoading } = useStats();
  const { matches, fetchMatches, autoUpdateMatches, deleteMatch, isLoading: isMatchesLoading } = useMatches();

  // UI state
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed">("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-earliest");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const MATCHES_PER_PAGE = 6;

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [matchPendingDeletion, setMatchPendingDeletion] = useState<Match | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Loading states
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingMatch, setIsDeletingMatch] = useState(false);

  // Sort options
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "date-earliest", label: "Date: Earliest to Latest" },
    { value: "date-latest", label: "Date: Latest to Earliest" },
    { value: "fee-low", label: "Fee: Low to High" },
    { value: "fee-high", label: "Fee: High to Low" },
  ];

  const getSortLabel = (value: SortOption) => {
    return sortOptions.find((opt) => opt.value === value)?.label || value;
  };

  // Feedback modals
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

  // Computed values
  const closestMatch = getClosestUpcomingMatch(matches);
  const countdown = useCountdown(closestMatch);
  const filteredMatches = sortMatches(
    filterMatches(matches, activeTab === "upcoming" ? "upcoming" : "completed", searchQuery),
    sortBy
  );

  const totalPages = Math.ceil(filteredMatches.length / MATCHES_PER_PAGE);
  const startIndex = (currentPage - 1) * MATCHES_PER_PAGE;
  const paginatedMatches = filteredMatches.slice(startIndex, startIndex + MATCHES_PER_PAGE);
  const startMatch = filteredMatches.length > 0 ? startIndex + 1 : 0;
  const endMatch = Math.min(currentPage * MATCHES_PER_PAGE, filteredMatches.length)

  // Initial data fetch and auto-update interval
  useEffect(() => {
    fetchStats();
    fetchMatches();
    autoUpdateMatches();

    const intervalId = setInterval(() => {
      autoUpdateMatches();
      fetchStats();
    }, AUTO_UPDATE_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [fetchStats, fetchMatches, autoUpdateMatches]);

  // Theme toggle
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  // Logout handler
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const { success, error } = await signOut();
      if (!success) {
        setErrorModal({
          isOpen: true,
          title: "Logout Failed",
          message: error || "Failed to sign out. Please try again.",
        });
        return;
      }
      setUser(null);
    } catch (logoutError) {
      console.error("Error signing out:", logoutError);
      setErrorModal({
        isOpen: true,
        title: "Logout Failed",
        message: "An unexpected error occurred while signing out.",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Modal handlers
  const handleNewMatch = () => setIsModalOpen(true);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMatch(null);
  };

  const handleEditMatch = (match: Match) => {
    setEditingMatch(match);
    setIsModalOpen(true);
  };

  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedMatch(null);
  };

  const handleRequestDeleteMatch = (match: Match) => {
    setMatchPendingDeletion(match);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setMatchPendingDeletion(null);
  };

  const handleCloseSuccessModal = () => {
    setSuccessModal({ isOpen: false, title: "", message: "" });
  };

  const handleCloseErrorModal = () => {
    setErrorModal({ isOpen: false, title: "", message: "" });
  };

  // Delete match handler
  const handleConfirmDeleteMatch = async () => {
    if (!matchPendingDeletion) return;

    setIsDeletingMatch(true);
    try {
      const success = await deleteMatch(matchPendingDeletion.id);

      if (success) {
        if (selectedMatch?.id === matchPendingDeletion.id) {
          handleCloseDetailsModal();
        }
        fetchStats();
        handleCloseDeleteModal();
        setSuccessModal({
          isOpen: true,
          title: "Success!",
          message: "Match deleted successfully!",
        });
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      console.error("Error deleting match:", error);
      setErrorModal({
        isOpen: true,
        title: "Error!",
        message: "Failed to delete match. Please try again.",
      });
    } finally {
      setIsDeletingMatch(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, sortBy]);

  // Submit match handler (create/update)
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
    try {
      const isEditing = editingMatch !== null;

      // Use the useMatches hook for create/update
      const { createMatch, updateMatch } = await import("@/hooks/useMatches").then(() => ({
        createMatch: async (data: typeof matchData) => {
          const { authFetch } = await import("@/lib/authFetch");
          const response = await authFetch("/api/matches", {
            method: "POST",
            body: JSON.stringify(data),
          });
          return response.ok;
        },
        updateMatch: async (id: string, data: typeof matchData) => {
          const { authFetch } = await import("@/lib/authFetch");
          const response = await authFetch(`/api/matches/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
          });
          return response.ok;
        }
      }));

      const success = isEditing
        ? await updateMatch(editingMatch.id, matchData)
        : await createMatch(matchData);

      if (!success) {
        throw new Error("Operation failed");
      }

      setIsModalOpen(false);
      setEditingMatch(null);
      fetchStats();
      fetchMatches();

      setSuccessModal({
        isOpen: true,
        title: "Success!",
        message: `Match ${isEditing ? "updated" : "created"} successfully!`,
      });
    } catch (error) {
      console.error(`Error ${editingMatch ? "updating" : "creating"} match:`, error);
      setErrorModal({
        isOpen: true,
        title: "Error!",
        message: `Failed to ${editingMatch ? "update" : "create"} match. Please try again.`,
      });
    }
  };

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="header-mobile">
          <div className="avatar centered">
            <Image
              src="/icons/icon.jpg"
              alt="logo-icon"
              width={40}
              height={40}
              className="rounded-full"
            />
          </div>
          <h1 className="dashboard-title">Capybara&apos;s Dashboard</h1>
          <div className="header-actions">
            <button type="button" className="theme-toggle" onClick={toggleTheme}>
              {isDarkMode ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              aria-label={isLoggingOut ? "Logging out" : "Logout"}
              title={isLoggingOut ? "Logging out" : "Logout"}
            >
              {isLoggingOut ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <LogOut className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
        <div className="header-desktop">
          <div className="header-title">
            <div className="avatar">
              <Image
                src="/icons/icon.jpg"
                alt="logo-icon"
                width={40}
                height={40}
                className="rounded-full"
              />
            </div>
            Capybara&apos;s Dashboard
          </div>
          <div className="header-actions">
            <button type="button" className="theme-toggle" onClick={toggleTheme}>
              {isDarkMode ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              aria-label={isLoggingOut ? "Logging out" : "Logout"}
              title={isLoggingOut ? "Logging out" : "Logout"}
            >
              {isLoggingOut ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <LogOut className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      {isMatchesLoading ? (
        <div className="upcoming-banner-skeleton">
          <div className="banner-skeleton-title" />
          <div className="banner-skeleton-name" />
          <div className="banner-skeleton-meta" />
        </div>
      ) : closestMatch && (
        <div className="upcoming-match-banner">
          <div className="upcoming-match-content">
            <div className="upcoming-match-header">
              <h2 className="upcoming-match-title">UPCOMING MATCH</h2>
              <span className="upcoming-match-date">{formatDate(closestMatch.date)}</span>
            </div>
            <div className="upcoming-match-details">
              <div className="upcoming-match-info">
                <h3 className="match-name">{closestMatch.location}</h3>
                <div className="match-meta">
                  <span className="match-time">
                    <svg className="h-4 w-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatTimeWithDuration(closestMatch.time)}
                  </span>
                  <span className="match-court">
                    <svg className="h-4 w-4 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="4" x2="20" y1="9" y2="9" />
                      <line x1="4" x2="20" y1="15" y2="15" />
                      <line x1="10" x2="8" y1="3" y2="21" />
                      <line x1="16" x2="14" y1="3" y2="21" />
                    </svg>
                    Court {closestMatch.courtNumber}
                  </span>
                  <span className="match-players">
                    <svg className="h-4 w-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Players: {closestMatch.players?.length || 0}
                  </span>
                </div>
              </div>
              <div className="upcoming-match-countdown">
                <div className="countdown-display">
                  <span className="countdown-label">Time Until Match</span>
                  <span className="countdown-timer">{countdown}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <StatsChart />

      <div className="stats-grid">
        {isStatsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="stat-card-skeleton">
                <div className="stat-skeleton-title" />
                <div className="stat-skeleton-value" />
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-title">Total Matches</span>
                <svg className="stat-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="stat-card-value">{stats.totalMatches}</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-title">Upcoming Matches</span>
                <svg className="stat-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="stat-card-value">{stats.upcomingMatches}</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-title">Completed Matches</span>
                <svg className="stat-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="stat-card-value">{stats.completedMatches}</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-title">Hours Played</span>
                <svg className="stat-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="stat-card-value">{stats.hoursPlayed}</div>
            </div>
          </>
        )}
      </div>

      <div className="tabs-section">
        <div className="tabs">
          <div
            className={`tab ${activeTab === "upcoming" ? "active" : ""}`}
            onClick={() => {
              if (sortBy !== "date-earliest") setSortBy("date-earliest");
              setActiveTab("upcoming");
            }}
          >
            Upcoming Matches
          </div>
          <div
            className={`tab ${activeTab === "completed" ? "active" : ""}`}
            onClick={() => {
              if (sortBy !== "date-latest") setSortBy("date-latest");
              setActiveTab("completed");
            }}
          >
            Past Matches
          </div>
        </div>
        <button type="button" className="btn-primary" onClick={handleNewMatch}>
          <span>+</span>
          New Match
        </button>
      </div>

      <div className="matches-container">
        {filterMatches(matches, activeTab === "upcoming" ? "upcoming" : "completed", "").length > 0 && (
          <div className="search-section">
            <input
              type="text"
              placeholder="Search matches by title or location..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
        {filteredMatches.length > 0 && (
          <div className="matches-header">
            <h3 className="matches-title">Matches List</h3>
            <div className="sort-dropdown-container">
              <button
                type="button"
                className="sort-trigger"
                onClick={() => setIsSortOpen(!isSortOpen)}
              >
                <span>{getSortLabel(sortBy)}</span>
                <ChevronDown size={16} className={`transition-transform duration-200 ${isSortOpen ? "rotate-180" : ""}`} />
              </button>

              {isSortOpen && (
                <>
                  <div className="dropdown-backdrop" onClick={() => setIsSortOpen(false)} />
                  <div className="sort-menu">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`sort-item ${sortBy === option.value ? "active" : ""}`}
                        onClick={() => {
                          setSortBy(option.value);
                          setIsSortOpen(false);
                          setCurrentPage(1);
                        }}
                      >
                        {option.label}
                        {sortBy === option.value && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {isMatchesLoading ? (
          <div className="matches-list">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="match-card-skeleton">
                <div className="match-skeleton-header" />
                <div className="match-skeleton-title" />
                <div className="match-skeleton-grid">
                  <div className="match-skeleton-item" />
                  <div className="match-skeleton-item" />
                  <div className="match-skeleton-item" />
                  <div className="match-skeleton-item" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="no-matches">
            {activeTab === "upcoming" ? "No upcoming matches found" : "No past matches found"}
          </div>
        ) : (
          <div className="matches-list">
            {paginatedMatches.map((match) => (
              <div
                key={match.id}
                className="match-card clickable-card"
                onClick={() => handleMatchClick(match)}
              >
                <div className="match-status-top">
                  <span className={`status-badge-modern ${match.status.toLowerCase()}`}>
                    {match.status}
                  </span>
                  <div className="card-actions">
                    <button
                      type="button"
                      className="action-btn-glass"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditMatch(match);
                      }}
                      title="Edit match"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="action-btn-glass delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestDeleteMatch(match);
                      }}
                      title="Delete match"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="match-header">
                  <h3 className="match-date-hero">{formatDate(match.date)}</h3>
                  <div className="match-location-sub">
                    <MapPin size={14} />
                    {match.location}
                  </div>
                </div>
                <div className="match-info-grid">
                  <div className="info-item">
                    <Clock size={14} />
                    <span>{formatTimeWithDuration(match.time)}</span>
                  </div>
                  <div className="info-item">
                    <Hash size={14} />
                    <span>Court {match.courtNumber}</span>
                  </div>
                  <div className="info-item">
                    <Users size={14} />
                    <span>{match.players?.length || 0} Players</span>
                  </div>
                  <div className="info-item">
                    <Calendar size={14} />
                    <span>{match.description?.includes("Week") ? match.description.split(" ")[1] : "Week -"}</span>
                  </div>
                </div>
                <div className="match-description">{match.description || ""}</div>
                <div className="match-bottom">
                  <div className="price-container">
                    <span className="price-label">Total Fee</span>
                    <span className={`match-fee-modern ${areAllPlayersPaid(match) ? "paid" : "unpaid"}`}>
                      {formatCurrency(match.fee)}
                    </span>
                  </div>

                  {areAllPlayersPaid(match) ? (
                    <div className="payment-status-pill all-paid">
                      <CheckCircle2 size={14} />
                      <span>All Paid</span>
                    </div>
                  ) : (
                    <div className="payment-status-pill pending">
                      <AlertCircle size={14} />
                      <span>{getPendingPaymentCount(match)} Pending</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div className="pagination-container">
            <button
              type="button"
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={20} />
            </button>
            <div className="pagination-info">
              <span className="pagination-page">Page {currentPage} of {totalPages}</span>
              <span className="pagination-range">Showing {startMatch} - {endMatch} of {filteredMatches.length}</span>
            </div>
            <button
              type="button"
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      <footer className="footer">
        <div className="footer-txt">© PB Capybara</div>
        <p>Badminton Management Dashboard</p>
      </footer>

      <NewMatchModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitMatch}
        editingMatch={editingMatch}
      />

      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={handleCloseSuccessModal}
        title={successModal.title}
        message={successModal.message}
      />

      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={handleCloseErrorModal}
        title={errorModal.title}
        message={errorModal.message}
      />

      <MatchDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        match={selectedMatch}
        onMatchUpdate={fetchMatches}
      />

      <DeleteMatchModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDeleteMatch}
        matchTitle={matchPendingDeletion?.title || matchPendingDeletion?.location}
        isLoading={isDeletingMatch}
      />
    </div>
  );
}
