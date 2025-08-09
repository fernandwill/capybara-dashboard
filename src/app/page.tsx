"use client";

import { useState, useEffect } from "react";
import NewMatchModal from "../components/NewMatchModal";
import SuccessModal from "../components/SuccessModal";
import MatchDetailsModal from "../components/MatchDetailsModal";

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
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

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

  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedMatch(null);
  };

  const handleSubmitMatch = async (matchData: unknown) => {
    try {
      const isEditing = editingMatch !== null;
      const url = isEditing
        ? `http://localhost:8000/api/matches/${editingMatch.id}`
        : "http://localhost:8000/api/matches";
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
      alert(
        `Failed to ${
          editingMatch ? "update" : "create"
        } match. Please try again.`
      );
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/stats");
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
  };

  const fetchMatches = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/matches");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMatches(data);
    } catch (error) {
      console.error("Error fetching matches:", error);
      setMatches([]);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchMatches();
  }, []);

  // Filter matches based on active tab and search query
  const filteredMatches = matches.filter((match) => {
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
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="header-title">
          <div className="avatar">🐹</div>
          Capybara`s Dashboard
        </div>
        <button className="theme-toggle">🌙</button>
      </header>

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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
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
                <div className="match-header">
                  <h3 className="match-title">{match.title}</h3>
                  <div className="match-header-right">
                    <span className="match-fee">
                      {formatCurrency(match.fee)}
                    </span>
                    <button
                      className="edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditMatch(match);
                      }}
                      title="Edit match"
                    >
                      ✏️
                    </button>
                  </div>
                </div>
                <div className="match-details">
                  <div className="match-info">
                    <span className="match-location">📍 {match.location}</span>
                    <span className="match-court">
                      Court #{match.courtNumber}
                    </span>
                  </div>
                  <div className="match-datetime">
                    <span className="match-date">{formatDate(match.date)}</span>
                    <span className="match-time">{match.time}</span>
                  </div>
                </div>
                {match.description && (
                  <div className="match-description">{match.description}</div>
                )}
                <div className="match-status">
                  <span
                    className={`status-badge ${match.status.toLowerCase()}`}
                  >
                    {match.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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

      <MatchDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        match={selectedMatch}
      />
    </div>
  );
}
