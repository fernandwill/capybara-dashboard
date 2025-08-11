"use client";

import { useState, useEffect } from "react";
import NewMatchModal from "../components/NewMatchModal";
import SuccessModal from "../components/SuccessModal";
import MatchDetailsModal from "../components/MatchDetailsModal";
import {Card, CardContent, CardHeader, CardTitle} from "../components/ui/card";
import Image from "next/image";

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
          <div className="avatar"><img src="https://i.pinimg.com/736x/0d/7f/47/0d7f47fee3574ef7a77c79da3a56e2d8.jpg" alt ="icon"/></div>
          Capybara&apos;s Dashboard
        </div>
        <button className="theme-toggle">🌙</button>
      </header>

      <div className="stats-grid">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
          <svg className="h-4 w-4 text-muted-foreground">...</svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalMatches}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Matches</CardTitle>
          <svg className="h-4 w-4 text-muted-foreground">...</svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.upcomingMatches}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed Matches</CardTitle>
          <svg className="h-4 w-4 text-muted-foreground">...</svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completedMatches}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Hours Played</CardTitle>
          <svg className="h-4 w-4 text-muted-foreground">...</svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.hoursPlayed}</div>
        </CardContent>
      </Card>
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
                    <span className="match-court">Court #{match.courtNumber}</span>
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
                  <span className={`status-badge ${match.status.toLowerCase()}`}>
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