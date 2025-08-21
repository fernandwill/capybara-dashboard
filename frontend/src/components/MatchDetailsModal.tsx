"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface Player {
  id: string;
  name: string;
  status: string;
  paymentStatus: string;
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

interface MatchDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
}

export default function MatchDetailsModal({
  isOpen,
  onClose,
  match,
}: MatchDetailsModalProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);

  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "long" });
    const year = date.getFullYear();
    return `${weekday}, ${day} ${month} ${year}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  

  const fetchPlayers = async () => {
    if (!match) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/matches/${match.id}`
      );
      if (response.ok) {
        const matchData = await response.json();
        const matchPlayers =
          matchData.players?.map((mp: { player: Player }) => mp.player) || [];
        setPlayers(matchPlayers);
      }
    } catch (error) {
      console.error("Error fetching match players:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!match) return;
    try {
      const response = await fetch(
        `/api/matches/${match.id}/players/${playerId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        fetchPlayers();
      }
    } catch (error) {
      console.error("Error removing player:", error);
    }
  };

  const handleCreateAndAddPlayer = async () => {
    if (!newPlayerName.trim() || !match) return;

    try {
      console.log("Creating player with name: ", newPlayerName.trim());
      const createResponse = await fetch("/api/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newPlayerName.trim(),
          status: "ACTIVE",
          paymentStatus: "BELUM_SETOR",
        }),
      });
      console.log("Create response status: ", createResponse.status);

      if (createResponse.ok) {
        const newPlayer = await createResponse.json();
        // Then add to match
        const addResponse = await fetch(
          `/api/matches/${match.id}/players`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ playerId: newPlayer.id }),
          }
        );

        if (addResponse.ok) {
          fetchPlayers();
          setNewPlayerName("");
          setShowAddPlayer(false);
        }
      }
    } catch (error) {
      console.error("Error creating player:", error);
    }
  };

  const handleTogglePayment = async (
    playerId: string,
    currentStatus: string
  ) => {
    const newStatus =
      currentStatus === "BELUM_SETOR" ? "SUDAH_SETOR" : "BELUM_SETOR";

    try {
      const response = await fetch(
        `/api/players/${playerId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ paymentStatus: newStatus }),
        }
      );

      if (response.ok) {
        fetchPlayers();
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
    }
  };

  const handleToggleStatus = async (
    playerId: string,
    currentStatus: string
  ) => {
    const newStatus = currentStatus === "ACTIVE" ? "TENTATIVE" : "ACTIVE";

    try {
      const response = await fetch(
        `/api/players/${playerId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        fetchPlayers();
      }
    } catch (error) {
      console.error("Error updating player status:", error);
    }
  };

  // Helper function to sort players by payment status
  const sortPlayersByPaymentStatus = (players: Player[]) => {
    return [...players].sort((a, b) => {
      // Players with "SUDAH_SETOR" should come before "BELUM_SETOR"
      if (a.paymentStatus === "SUDAH_SETOR" && b.paymentStatus === "BELUM_SETOR") return -1;
      if (a.paymentStatus === "BELUM_SETOR" && b.paymentStatus === "SUDAH_SETOR") return 1;
      return 0; // Keep original order for players with same payment status
    });
  };

  useEffect(() => {
    if (isOpen && match) {
      // Fetch players when modal opens
      const fetchPlayers = async () => {
        setLoading(true);
        try {
          const response = await fetch(
            `/api/matches/${match.id}`
          );
          if (response.ok) {
            const matchData = await response.json();
            const matchPlayers =
              matchData.players?.map((mp: { player: Player }) => mp.player) || [];
            setPlayers(matchPlayers);
          }
        } catch (error) {
          console.error("Error fetching match players:", error);
          setPlayers([]); // Reset players on error
        } finally {
          setLoading(false);
        }
      };

      fetchPlayers();
    } else {
      // Reset data when modal closes
      setPlayers([]);
      setShowAddPlayer(false);
      setNewPlayerName("");
    }
  }, [isOpen, match]);

  if (!isOpen || !match) return null;

  return (
    <div className="modal-overlay">
      <div className="match-details-modal">
        <div className="modal-header">
          <h2>Match Details</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="match-details-content">
          {/* Match Information */}
          <div className="match-info-section">
            <div className="match-title-with-status">
              <h3 className="match-details-title">{match.title}</h3>
              <span className={`status-badge ${match.status.toLowerCase()}`}>
                {match.status}
              </span>
            </div>
            <div className="match-details-grid">
              <div className="detail-item">
                <span className="detail-label">Location:</span>
                <span className="detail-value">
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
              </div>
              <div className="detail-item">
                <span className="detail-label">Court:</span>
                <span className="detail-value">{match.courtNumber}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Date:</span>
                <span className="detail-value">{formatDate(match.date)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Time:</span>
                <span className="detail-value">{match.time}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Fee:</span>
                <span className="detail-value fee-value">
                  {formatCurrency(match.fee)}
                </span>
              </div>
            </div>
            {match.description && (
              <div className="match-description">
                <span className="detail-label">Description:</span>
                <p>{match.description}</p>
              </div>
            )}
          </div>

          {/* Players Section */}
          <div className="players-section">
            <div className="players-header">
              <h3>Players ({players.length})</h3>
              <button
                className="add-player-btn"
                onClick={() => setShowAddPlayer(!showAddPlayer)}
              >
                + Add Player
              </button>
            </div>

            {/* Add Player Section */}
            {showAddPlayer && (
              <div className="add-player-section">
                <div className="new-player">
                  <div className="new-player-form">
                    <input
                      type="text"
                      placeholder="Player name..."
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      className="form-input"
                    />
                    <button
                      className="create-player-btn"
                      onClick={handleCreateAndAddPlayer}
                      disabled={!newPlayerName.trim()}
                    >
                      Add Player
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading state */}
            {loading ? (
              <div className="no-players-message flex flex-col items-center justify-center">
                <p>Loading players...</p>
                <Loader2 className="h-6 w-6 animate-spin text-blue-500 mt-2" />
              </div>
            ) : (
              <div className="players-columns">
                <div className="players-column">
                  <h4 className="column-title">Players</h4>
                  <div className="players-grid-column">
                    {players.filter(player => player.status === "ACTIVE").length > 0 ? (
                      sortPlayersByPaymentStatus(players.filter(player => player.status === "ACTIVE")).map((player) => (
                        <div key={player.id} className="player-card">
                          <div className="player-header">
                            <h4 className="player-name">{player.name}</h4>
                            <button
                              className="remove-player-btn"
                              onClick={() => handleRemovePlayer(player.id)}
                              title="Remove player"
                            >
                              ×
                            </button>
                          </div>
                          <div className="player-status-buttons">
                            <button
                              className={`status-toggle ${player.status.toLowerCase()}`}
                              onClick={() =>
                                handleToggleStatus(player.id, player.status)
                              }
                            >
                              {player.status}
                            </button>
                            <button
                              className={`payment-toggle ${player.paymentStatus.toLowerCase()}`}
                              onClick={() =>
                                handleTogglePayment(player.id, player.paymentStatus)
                              }
                            >
                              {player.paymentStatus === "BELUM_SETOR"
                                ? "Belum Setor"
                                : "Sudah Setor"}
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-players-message">
                        <p>No active players yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="players-column">
                  <h4 className="column-title">Tentative</h4>
                  <div className="players-grid-column">
                    {players.filter(player => player.status === "TENTATIVE").length > 0 ? (
                      sortPlayersByPaymentStatus(players.filter(player => player.status === "TENTATIVE")).map((player) => (
                        <div key={player.id} className="player-card">
                          <div className="player-header">
                            <h4 className="player-name">{player.name}</h4>
                            <button
                              className="remove-player-btn"
                              onClick={() => handleRemovePlayer(player.id)}
                              title="Remove player"
                            >
                              ×
                            </button>
                          </div>
                          <div className="player-status-buttons">
                            <button
                              className={`status-toggle ${player.status.toLowerCase()}`}
                              onClick={() =>
                                handleToggleStatus(player.id, player.status)
                              }
                            >
                              {player.status}
                            </button>
                            <button
                              className={`payment-toggle ${player.paymentStatus.toLowerCase()}`}
                              onClick={() =>
                                handleTogglePayment(player.id, player.paymentStatus)
                              }
                            >
                              {player.paymentStatus === "BELUM_SETOR"
                                ? "Belum Setor"
                                : "Sudah Setor"}
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-players-message">
                        <p>No tentative players yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!loading && players.length === 0 && (
              <div className="no-players-message">
                <p>No players added to this match yet.</p>
                <p>Click &quot;Add Player&quot; to get started!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
