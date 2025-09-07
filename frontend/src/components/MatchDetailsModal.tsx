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
  players?: {
    player: {
      id: string;
      name: string;
      status: string;
      paymentStatus: string;
    };
  }[];
}

interface MatchDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  onMatchUpdate?: () => void;
}

export default function MatchDetailsModal({
  isOpen,
  onClose,
  match,
  onMatchUpdate,
}: MatchDetailsModalProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(false);

  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");

  // State for payment status filters - by default show all players
  const [showSudahSetor, setShowSudahSetor] = useState(true);
  const [showBelumSetor, setShowBelumSetor] = useState(true);
  const [showSudahSetorTentative, setShowSudahSetorTentative] = useState(true);
  const [showBelumSetorTentative, setShowBelumSetorTentative] = useState(true);

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

  const formatTimeWithDuration = (timeString: string) => {
    if (!timeString || !timeString.includes('-')) {
      return timeString;
    }
    try {
      const [startTime, endTime] = timeString.split('-').map(t => t.trim());
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);

      if (isNaN(startHours) || isNaN(startMinutes) || isNaN(endHours) || isNaN(endMinutes)) {
        return timeString;
      }

      const startDate = new Date();
      startDate.setHours(startHours, startMinutes, 0, 0);

      const endDate = new Date();
      endDate.setHours(endHours, endMinutes, 0, 0);

      let durationMillis = endDate.getTime() - startDate.getTime();
      if (durationMillis < 0) {
        // Handle overnight case
        const dayInMillis = 24 * 60 * 60 * 1000;
        durationMillis += dayInMillis;
      }
      
      const durationHours = durationMillis / (1000 * 60 * 60);
      // round to 1 decimal place
      const roundedDuration = Math.round(durationHours * 10) / 10;

      return `${timeString} (${roundedDuration} hrs)`;
    } catch (error) {
      console.error("Error formatting time with duration:", error);
      return timeString;
    }
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

  const handleAddPlayer = async (playerId: string) => {
    if (!match) return;
    try {
      const response = await fetch(
        `/api/matches/${match.id}/players`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ playerId }),
        }
      );

      if (response.ok) {
        fetchPlayers();
        // Trigger dashboard refresh to update player counts
        if (onMatchUpdate) {
          onMatchUpdate();
        }
      }
    } catch (error) {
      console.error("Error adding player:", error);
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
        // Trigger dashboard refresh to update player counts
        if (onMatchUpdate) {
          onMatchUpdate();
        }
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
        await handleAddPlayer(newPlayer.id);
        setNewPlayerName("");
        setShowAddPlayer(false);
      }
    } catch (error) {
      console.error("Error creating player:", error);
    }
  };

  const handleSetPlayerStatus = async (
    playerId: string,
    newStatus: string
  ) => {
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

  const handleSetPaymentStatus = async (
    playerId: string,
    newPaymentStatus: string
  ) => {
    try {
      const response = await fetch(
        `/api/players/${playerId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ paymentStatus: newPaymentStatus }),
        }
      );

      if (response.ok) {
        fetchPlayers();
        // Trigger dashboard refresh to update fee indicators
        if (onMatchUpdate) {
          onMatchUpdate();
        }
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
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
      const fetchMatchPlayers = async () => {
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

      const fetchAllPlayers = async () => {
        try {
          const response = await fetch('/api/players');
          if(response.ok) {
            const data = await response.json();
            setAllPlayers(data);
          }
        } catch (error) {
          console.error("Error fetching all players:", error);
        }
      }

      fetchMatchPlayers();
      fetchAllPlayers();
    } else {
      // Reset data when modal closes
      setPlayers([]);
      setShowAddPlayer(false);
      setNewPlayerName("");
      setAllPlayers([]);
      setSearchQuery("");
    }
  }, [isOpen, match]);

  const filteredPlayers = allPlayers.filter(player => {
    // check if player is already in the match
    const isPlayerInMatch = players.some(p => p.id === player.id);
    if (isPlayerInMatch) {
      return false;
    }
    // check if player name matches search query
    if (searchQuery.trim() === "") {
      return true; // show all if search is empty
    }
    return player.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
              <h3 className="match-details-title">{match.location} - {formatDate(match.date)}</h3>
              <span className={`status-badge ${match.status.toLowerCase()}`}>
                {match.status}
              </span>
            </div>
            <div className="match-details-grid">
              <div className="detail-item">
                <span className="detail-label">Court:</span>
                <span className="detail-value">{match.courtNumber}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Time:</span>
                <span className="detail-value">{formatTimeWithDuration(match.time)}</span>
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
                <div className="add-player-options">
                  <h4>Add Existing Player</h4>
                  <input
                    type="text"
                    placeholder="Search existing players..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-input"
                  />
                  <div className="existing-players-list">
                    {filteredPlayers.length > 0 ? (
                      filteredPlayers.map(player => (
                        <div key={player.id} className="existing-player-item">
                          <span>{player.name}</span>
                          <button onClick={() => handleAddPlayer(player.id)} className="add-player-btn-small">Add</button>
                        </div>
                      ))
                    ) : (
                      <p className="no-players">No matching players found.</p>
                    )}
                  </div>
                </div>
                <div className="or-divider">OR</div>
                <div className="new-player">
                  <h4>Create New Player</h4>
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
                      Create and Add Player
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
                  <div className="column-header">
                    <h4 className="column-title">Players</h4>
                    <div className="payment-filters">
                      <button 
                        className={`payment-filter ${showSudahSetor ? 'active' : ''}`}
                        onClick={() => setShowSudahSetor(!showSudahSetor)}
                      >
                        Sudah Setor
                      </button>
                      <button 
                        className={`payment-filter ${showBelumSetor ? 'active' : ''}`}
                        onClick={() => setShowBelumSetor(!showBelumSetor)}
                      >
                        Belum Setor
                      </button>
                    </div>
                  </div>
                  <div className="players-grid-column">
                    {players.filter(player => player.status === "ACTIVE").length > 0 ? (
                      sortPlayersByPaymentStatus(players.filter(player => player.status === "ACTIVE"))
                        .filter(player => {
                          // Show based on toggle state
                          if (showSudahSetor && player.paymentStatus === "SUDAH_SETOR") return true;
                          if (showBelumSetor && player.paymentStatus === "BELUM_SETOR") return true;
                          return false;
                        })
                        .map((player) => (
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
                            <div className="player-status-controls">
                              <button
                                className={`status-btn ${player.status === 'ACTIVE' ? 'active' : 'inactive'}`}
                                onClick={() => handleSetPlayerStatus(player.id, 'ACTIVE')}
                              >
                                ACTIVE
                              </button>
                              <button
                                className={`status-btn ${player.status === 'TENTATIVE' ? 'tentative' : 'no-color'}`}
                                onClick={() => handleSetPlayerStatus(player.id, 'TENTATIVE')}
                              >
                                SET PLAYER AS TENTATIVE
                              </button>
                              <button
                                className={`payment-btn ${player.paymentStatus === 'BELUM_SETOR' ? 'belum-setor' : 'no-color'}`}
                                onClick={() => handleSetPaymentStatus(player.id, 'BELUM_SETOR')}
                              >
                                BELUM SETOR
                              </button>
                              <button
                                className={`payment-btn ${player.paymentStatus === 'SUDAH_SETOR' ? 'sudah-setor' : 'no-color'}`}
                                onClick={() => handleSetPaymentStatus(player.id, 'SUDAH_SETOR')}
                              >
                                SUDAH SETOR
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

                {/* Tentative Column - Only show if there are tentative players */}
                {players.some(player => player.status === "TENTATIVE") && (
                  <div className="players-column">
                    <div className="column-header">
                      <h4 className="column-title">Tentative</h4>
                      <div className="payment-filters">
                        <button 
                          className={`payment-filter ${showSudahSetorTentative ? 'active' : ''}`}
                          onClick={() => setShowSudahSetorTentative(!showSudahSetorTentative)}
                        >
                          Sudah Setor
                        </button>
                        <button 
                          className={`payment-filter ${showBelumSetorTentative ? 'active' : ''}`}
                          onClick={() => setShowBelumSetorTentative(!showBelumSetorTentative)}
                        >
                          Belum Setor
                        </button>
                      </div>
                    </div>
                    <div className="players-grid-column">
                      {players.filter(player => player.status === "TENTATIVE").length > 0 ? (
                        sortPlayersByPaymentStatus(players.filter(player => player.status === "TENTATIVE"))
                          .filter(player => {
                            // Show based on toggle state
                            if (showSudahSetorTentative && player.paymentStatus === "SUDAH_SETOR") return true;
                            if (showBelumSetorTentative && player.paymentStatus === "BELUM_SETOR") return true;
                            return false;
                          })
                          .map((player) => (
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
                              <div className="player-status-controls">
                                <button
                                  className={`status-btn ${player.status === 'ACTIVE' ? 'active' : 'no-color'}`}
                                  onClick={() => handleSetPlayerStatus(player.id, 'ACTIVE')}
                                >
                                  SET PLAYER AS ACTIVE
                                </button>
                                <button
                                  className={`status-btn ${player.status === 'TENTATIVE' ? 'tentative' : 'no-color'}`}
                                  onClick={() => handleSetPlayerStatus(player.id, 'TENTATIVE')}
                                >
                                  TENTATIVE
                                </button>
                                <button
                                  className={`payment-btn ${player.paymentStatus === 'BELUM_SETOR' ? 'belum-setor' : 'no-color'}`}
                                  onClick={() => handleSetPaymentStatus(player.id, 'BELUM_SETOR')}
                                >
                                  BELUM SETOR
                                </button>
                                <button
                                  className={`payment-btn ${player.paymentStatus === 'SUDAH_SETOR' ? 'sudah-setor' : 'no-color'}`}
                                  onClick={() => handleSetPaymentStatus(player.id, 'SUDAH_SETOR')}
                                >
                                  SUDAH SETOR
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
                )}
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
