"use client";

import { useState, useEffect, useCallback } from "react";
import NewMatchModal from "../components/NewMatchModal";
import SuccessModal from "../components/SuccessModal";
import ErrorModal from "../components/ErrorModal";
import MatchDetailsModal from "../components/MatchDetailsModal";
import { Select } from "../components/ui/select";
import Image from "next/image";
import StatsChart from "../components/StatsChart";

type SortOption = "date-earliest" | "date-latest" | "fee-low" | "fee-high";

interface Stats {
  totalMatches: number;
  upcomingMatches: number;
  completedMatches: number;
  hoursPlayed: string;
}

interface Match {
  id: string;
  title: string;
  location: string;
  courtNumber: string;
  date: string;
  time: string;
  fee: number;
  status: string;
  description?: string;
  createdAt: string;
  players?: {
    player: {
      id: string;
      name: string;
      status: string;
      paymentStatus: string;
    };
  }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalMatches: 0,
    upcomingMatches: 0,
    completedMatches: 0,
    hoursPlayed: "0.0",
  });
  const [activeTab, setActiveTab] = useState("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: "",
    message: "",
  });
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    title: "",
    message: "",
  });
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("date-earliest");

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  useEffect(() => {
    // Initialize theme on component mount
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

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

  const handleCloseSuccessModal = () => {
    setSuccessModal({
      isOpen: false,
      title: "",
      message: "",
    });
  };

  const handleCloseErrorModal = () => {
    setErrorModal({
      isOpen: false,
      title: "",
      message: "",
    });
  };

  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedMatch(null);
  };

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/stats");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Keep default values if API fails
      setStats({
        totalMatches: 0,
        upcomingMatches: 0,
        completedMatches: 0,
        hoursPlayed: "0.0",
      });
    }
  }, []);

  const fetchMatches = useCallback(async () => {
    try {
      const response = await fetch("/api/matches");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMatches(data);
    } catch (error) {
      console.error("Error fetching matches:", error);
      setMatches([]);
    }
  }, []);

  const autoUpdateMatches = useCallback(async () => {
    try {
      const response = await fetch("/api/matches/auto-update", {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Auto-update result:", data);
      
      // Refresh matches and stats after auto-update
      fetchMatches();
      fetchStats();
    } catch (error) {
      console.error("Error auto-updating matches:", error);
    }
  }, [fetchMatches, fetchStats]);

  useEffect(() => {
    fetchStats();
    fetchMatches();
    autoUpdateMatches(); // Run auto-update when dashboard loads
  }, [fetchStats, fetchMatches, autoUpdateMatches]);

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
    try {
      const isEditing = editingMatch !== null;
      const url = isEditing
        ? `/api/matches/${editingMatch.id}`
        : "/api/matches";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(matchData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(
        `Match ${isEditing ? "updated" : "created"} successfully:`,
        result
      );

      // Close modal and reset editing state
      setIsModalOpen(false);
      setEditingMatch(null);

      // Refresh stats and matches
      fetchStats();
      fetchMatches();

      // Show success modal
      setSuccessModal({
        isOpen: true,
        title: "Success!",
        message: `Match ${isEditing ? "updated" : "created"} successfully!`,
      });
    } catch (error) {
      console.error(
        `Error ${editingMatch ? "updating" : "creating"} match:`,
        error
      );
      setErrorModal({
        isOpen: true,
        title: "Error!",
        message: `Failed to ${
          editingMatch ? "update" : "create"
        } match. Please try again.`,
      });
    }
  };

  // Helper function to sort matches based on selected option
  const sortMatches = (matches: Match[], sortOption: SortOption): Match[] => {
    return [...matches].sort((a, b) => {
      switch (sortOption) {
        case "date-earliest":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "date-latest":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "fee-low":
          return a.fee - b.fee;
        case "fee-high":
          return b.fee - a.fee;
        default:
          return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
    });
  };

  // Filter matches based on active tab and search query
  const filteredMatches = sortMatches(
    matches.filter((match) => {
      // Filter by status (upcoming vs completed)
      const statusMatch =
        activeTab === "upcoming"
          ? match.status === "UPCOMING"
          : match.status === "COMPLETED";

      // Filter by search query (title or location)
      const searchMatch =
        searchQuery === "" ||
        match.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.location.toLowerCase().includes(searchQuery.toLowerCase());

      return statusMatch && searchMatch;
    }),
    sortBy
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "long" });
    const year = date.getFullYear();
    return `${weekday}, ${day} ${month} ${year}`;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Check if all players have paid (status is "SUDAH_SETOR")
  const areAllPlayersPaid = (match: Match): boolean => {
    if (!match.players || match.players.length === 0) {
      return false; // No players means not fully paid
    }
    return match.players.every(playerMatch => 
      playerMatch.player.paymentStatus === "SUDAH_SETOR"
    );
  };

  return (
    <div className="dashboard-container">
      <header className="header">
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
        <button className="theme-toggle" onClick={toggleTheme}>
          {isDarkMode ? (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>
      </header>

      <StatsChart />

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Matches</span>
            <svg
              className="stat-card-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div className="stat-card-value">{stats.totalMatches}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Upcoming Matches</span>
            <svg
              className="stat-card-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="stat-card-value">{stats.upcomingMatches}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Completed Matches</span>
            <svg
              className="stat-card-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="stat-card-value">{stats.completedMatches}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Hours Played</span>
            <svg
              className="stat-card-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="stat-card-value">{stats.hoursPlayed}</div>
        </div>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="Search matches by title or location..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="tabs-section">
        <div className="tabs">
          <div
            className={`tab ${activeTab === "upcoming" ? "active" : ""}`}
            onClick={() => setActiveTab("upcoming")}
          >
            Upcoming Matches
          </div>
          <div
            className={`tab ${activeTab === "past" ? "active" : ""}`}
            onClick={() => setActiveTab("past")}
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
        <div className="matches-header">
          <h3 className="matches-title">Matches List</h3>
          <div className="sort-section-inline">
            <label htmlFor="sort-select" className="sort-label">
              Sort by:
            </label>
            <Select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="sort-select-inline"
            >
              <option value="date-earliest">Date: Earliest to Latest</option>
              <option value="date-latest">Date: Latest to Earliest</option>
              <option value="fee-low">Fee: Low to High</option>
              <option value="fee-high">Fee: High to Low</option>
            </Select>
          </div>
        </div>
        
        {filteredMatches.length === 0 ? (
          <div className="no-matches">
            {activeTab === "upcoming"
              ? "No upcoming matches found"
              : "No past matches found"}
          </div>
        ) : (
          <div className="matches-list">
            {filteredMatches.map((match) => (
              <div
                key={match.id}
                className="match-card clickable-card"
                onClick={() => handleMatchClick(match)}
              >
                <div className="match-status-top">
                  <span
                    className={`status-badge ${match.status.toLowerCase()}`}
                  >
                    {match.status}
                  </span>
                </div>
                <div className="match-header">
                  <h3 className="match-title">{match.title}</h3>
                  <div className="match-header-right">
                    <button
                      className="edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditMatch(match);
                      }}
                      title="Edit match"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        ></path>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="match-details">
                  <div className="match-datetime">
                    <span className="match-date">
                      <svg
                        className="h-4 w-4 inline mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {formatDate(match.date)}
                    </span>
                    <span className="match-time">
                      <svg
                        className="h-4 w-4 inline mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {match.time}
                    </span>
                  </div>
                  <div className="match-info">
                    <span className="match-location">
                      <svg
                        className="h-4 w-4 inline mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {match.location}
                    </span>
                    <span className="match-court">
                      Court {match.courtNumber}
                    </span>
                    <span className="match-players">
                      <svg
                        className="h-4 w-4 inline mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      Players: {match.players?.length || 0}
                    </span>
                  </div>
                </div>
                {match.description && (
                  <div className="match-description">{match.description}</div>
                )}
                <div className="match-bottom">
                  <div className="match-price">
                    <span className={`match-fee ${areAllPlayersPaid(match) ? 'fee-paid' : 'fee-unpaid'}`}>
                      {formatCurrency(match.fee)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="footer">
        <div className="footer-txt">© PB Capybara</div>
        <p>Badminton Dashboard</p>
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
    </div>
  );
}
