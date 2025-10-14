"use client";

import { useMemo, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "@/lib/authService";

import DeleteMatchModal from "../components/DeleteMatchModal";
import ErrorModal from "../components/ErrorModal";
import MatchDetailsModal from "../components/MatchDetailsModal";
import NewMatchModal from "../components/NewMatchModal";
import StatsChart from "../components/StatsChart";
import SuccessModal from "../components/SuccessModal";
import { Select } from "../components/ui/select";
import { DashboardHeader } from "./dashboard/components/DashboardHeader";
import { MatchesList } from "./dashboard/components/MatchesList";
import { StatsOverview } from "./dashboard/components/StatsOverview";
import { UpcomingMatchBanner } from "./dashboard/components/UpcomingMatchBanner";
import { useDashboardData } from "./dashboard/hooks/useDashboardData";
import { useMatchCountdown } from "./dashboard/hooks/useMatchCountdown";
import { filterMatches, getClosestUpcomingMatch } from "./dashboard/utils/matchUtils";
import { Match, SortOption } from "./dashboard/types";

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
}

type Tab = "upcoming" | "past";

export function Dashboard() {
  const { setUser } = useAuth();
  const {
    stats,
    matches,
    fetchMatches,
    submitMatch,
    deleteMatch,
    isDeleting,
  } = useDashboardData();

  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
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
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [matchPendingDeletion, setMatchPendingDeletion] = useState<Match | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("date-earliest");

  const filteredMatches = useMemo(
    () => filterMatches(matches, activeTab, searchQuery, sortBy),
    [matches, activeTab, searchQuery, sortBy]
  );

  const closestMatch = useMemo(
    () => getClosestUpcomingMatch(matches),
    [matches]
  );

  const countdown = useMatchCountdown(closestMatch);

  const toggleTheme = () => {
    setIsDarkMode((previous) => !previous);
    document.documentElement.classList.toggle("dark");
  };

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

  const handleNewMatch = () => {
    setIsModalOpen(true);
  };

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

  const handleSubmitMatch = async (matchData: {
    title: string;
    location: string;
    courtNumber: string;
    date: string;
    time: string;
    fee: number;
    status: string;
    description?: string;
  }) => {
    const result = await submitMatch(matchData, editingMatch?.id);

    if (result.success) {
      setIsModalOpen(false);
      setEditingMatch(null);
      setSuccessModal({
        isOpen: true,
        title: "Success!",
        message: `Match ${editingMatch ? "updated" : "created"} successfully!`,
      });
    } else {
      setErrorModal({
        isOpen: true,
        title: "Error!",
        message: result.error,
      });
    }
  };

  const handleConfirmDeleteMatch = async () => {
    if (!matchPendingDeletion) return;

    const result = await deleteMatch(matchPendingDeletion.id);

    if (result.success) {
      if (selectedMatch?.id === matchPendingDeletion.id) {
        handleCloseDetailsModal();
      }

      setSuccessModal({
        isOpen: true,
        title: "Success!",
        message: "Match deleted successfully!",
      });
      handleCloseDeleteModal();
    } else {
      setErrorModal({
        isOpen: true,
        title: "Error!",
        message: result.error,
      });
    }
  };

  return (
    <div className="dashboard-container">
      <DashboardHeader
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />

      {closestMatch && (
        <UpcomingMatchBanner match={closestMatch} countdown={countdown} />
      )}

      <StatsOverview stats={stats} />
      <StatsChart />

      <div className="search-section">
        <input
          type="text"
          placeholder="Search matches by title or location..."
          className="search-input"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>

      <div className="tabs-section">
        <div className="tabs">
          <div
            className={`tab ${activeTab === "upcoming" ? "active" : ""}`}
            onClick={() => {
              if (sortBy !== "date-earliest") {
                setSortBy("date-earliest");
              }
              setActiveTab("upcoming");
            }}
          >
            Upcoming Matches
          </div>
          <div
            className={`tab ${activeTab === "past" ? "active" : ""}`}
            onClick={() => {
              if (sortBy !== "date-latest") {
                setSortBy("date-latest");
              }
              setActiveTab("past");
            }}
          >
            Past Matches
          </div>
        </div>
        <button className="new-match-btn" onClick={handleNewMatch}>
          <span>+</span>
          New Match
        </button>
      </div>

      <div className="matches-container">
        {filteredMatches.length > 0 && (
          <div className="matches-header">
            <h3 className="matches-title">Matches List</h3>
            <div className="sort-section-inline">
              <label htmlFor="sort-select" className="sort-label">
                Sort by:
              </label>
              <Select
                id="sort-select"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                className="sort-select-inline"
              >
                <option value="date-earliest">Date: Earliest to Latest</option>
                <option value="date-latest">Date: Latest to Earliest</option>
                <option value="fee-low">Fee: Low to High</option>
                <option value="fee-high">Fee: High to Low</option>
              </Select>
            </div>
          </div>
        )}

        {filteredMatches.length === 0 ? (
          <div className="no-matches">
            {activeTab === "upcoming"
              ? "No upcoming matches found"
              : "No past matches found"}
          </div>
        ) : (
          <MatchesList
            matches={filteredMatches}
            onSelect={handleMatchClick}
            onEdit={handleEditMatch}
            onDelete={handleRequestDeleteMatch}
          />
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
        onClose={() =>
          setSuccessModal({
            isOpen: false,
            title: "",
            message: "",
          })
        }
        title={successModal.title}
        message={successModal.message}
      />

      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() =>
          setErrorModal({
            isOpen: false,
            title: "",
            message: "",
          })
        }
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
        matchTitle={
          matchPendingDeletion?.title || matchPendingDeletion?.location
        }
        isLoading={isDeleting}
      />
    </div>
  );
}
