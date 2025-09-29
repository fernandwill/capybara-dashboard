"use client";

import { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";


interface Player {
  id: string;
  name: string;
  status: string;
  paymentStatus: string;
  matchPlayers?: {
    match: {
      id: string;
      date: string;
    };
  }[];
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
  const [pastPlayers, setPastPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPastPlayers, setLoadingPastPlayers] = useState(false);

  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [playerRemove, setPlayerRemove] = useState<
  {id: string; name: string;} | null>(null);
  const [removePlayer, setRemovePlayer] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
      // Also handle mobile safari issues
      document.body.style.position = 'fixed';
      document.body.style.top = `-${window.scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // Restore scrolling when modal closes
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      // Restore scroll position
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    
    // Cleanup function
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

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
    
    // Also refresh past players
    try {
      const response = await fetch(`/api/matches/${match.id}/players/past`);
      if (response.ok) {
        const data = (await response.json() as Player[]);
        setPastPlayers(deduplicatePlayers(data));
      }
    } catch (error) {
      console.error("Error fetching past players:", error);
    }
  };

  const deduplicatePlayers = (playersList: Player[]): Player[] => {
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    const deduplicatedPlayers: Player[] = [];
    for (const player of playersList) {
      const trimmedName = player.name.trim();
      const normalizedName = trimmedName.toLowerCase();

      if (seenIds.has(player.id) || seenNames.has(normalizedName)) continue;

      seenIds.add(player.id);
      seenNames.add(normalizedName);
      deduplicatedPlayers.push({...player, name: trimmedName});
    }

    return deduplicatedPlayers;
  };

  const handleAddPlayer = async (playerId: string) => {
    if (!match) return;
    try {

      const resetResponse = await fetch(`/api/players/${playerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: 'ACTIVE', paymentStatus: 'BELUM_SETOR' }),
      });

      if (!resetResponse.ok) {
        console.error("Failed to reset player status.");
      }

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

    const handleRemovePlayer = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    
    setRemovePlayer(false);
    setPlayerRemove({
      id: playerId,
      name: player ? player.name : "this player",
    });
  };

  const handleCancelRemovePlayer = () => {
    if (removePlayer) return;
      setPlayerRemove(null);
    };

    const handleConfirmRemovePlayer = async () => {
      if (!match || !playerRemove) return;

      setRemovePlayer(true);

    try {
      const response = await fetch(
        `/api/matches/${match.id}/players/${playerRemove.id}`,
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
        setPlayerRemove(null);
      } else {
        console.error("Failed to remove player from match.");
        window.alert("Failed to remove player. Please try again.");
      }
    } catch (error) {
      console.error("Error removing player:", error);
      window.alert("An unexpected error occurred while removing the player.");
    } finally {
      setRemovePlayer(false);
    }
  }

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

      // Fetch players from past matches
      const fetchPastPlayers = async () => {
        setLoadingPastPlayers(true);
        try {
          const response = await fetch(`/api/matches/${match.id}/players/past`);
          if (response.ok) {
            const data = (await response.json()) as Player[];
            setPastPlayers(deduplicatePlayers(data));
          }
        } catch (error) {
          console.error("Error fetching past players:", error);
          setPastPlayers([]);
        } finally {
          setLoadingPastPlayers(false);
        }
      };

      fetchMatchPlayers();
      fetchPastPlayers();
    } else {
      // Reset data when modal closes
      setPlayers([]);
      setPastPlayers([]);
      setShowAddPlayer(false);
      setNewPlayerName("");;
      setPlayerRemove(null);
      setRemovePlayer(false);
    }
  }, [isOpen, match]);

  if (!isOpen || !match) return null;

  return (
    <>
      <div className="modal-overlay">
      <div className="match-details-modal">
        <div className="modal-header">
          <h2>Match Details</h2>
          <div className="modal-header-actions">
            <button className="modal-close" onClick={onClose}>
              < X />
            </button>
          </div>
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
                <span className="detail-label">Court No:</span>
                <span className="detail-value">{match.courtNumber}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Time:</span>
                <span className="detail-value">{formatTimeWithDuration(match.time)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Court Fee:</span>
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
                  <h4>Players from Past Matches</h4>
                  {loadingPastPlayers ? (
                    <div className="loading-past-players">
                      <p>Loading players from past matches...</p>
                    </div>
                  ) : pastPlayers.length > 0 ? (
                    <div className="existing-players-list">
                      {pastPlayers
                        .filter(player => !players.some(p => p.id === player.id)) // Filter out players already in match
                        .map(player => (
                          <div key={player.id} className="existing-player-item">
                            <span>{player.name}</span>
                            <button 
                              onClick={() => handleAddPlayer(player.id)} 
                              className="add-player-btn-small"
                            >
                              Add
                            </button>
                          </div>
                        ))
                      }
                    </div>
                  ) : (
                    <p className="no-players">No players found in recent matches.</p>
                  )}
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
              <div className={players.some(p => p.status === 'TENTATIVE') ? "players-columns" : ""}>
                <div className="players-column">
                  <div className={!players.some(p => p.status === 'TENTATIVE') ? 'grid grid-cols-2 gap-4' : 'players-grid-column'}>
                    {players.filter(player => player.status === "ACTIVE").length > 0 ? (
                      sortPlayersByPaymentStatus(players.filter(player => player.status === "ACTIVE"))
                        .map((player) => (
                          <div key={player.id} className="player-card">
                            <div className="player-header">
                              <h4 className="player-name">{player.name}</h4>
                              <button
                                className="remove-player-btn"
                                onClick={() => handleRemovePlayer(player.id)}
                                title="Remove player"
                              >
                                < X />
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
                    <div className="players-grid-column">
                      {players.filter(player => player.status === "TENTATIVE").length > 0 ? (
                        sortPlayersByPaymentStatus(players.filter(player => player.status === "TENTATIVE"))
                          .map((player) => (
                            <div key={player.id} className="player-card">
                              <div className="player-header">
                                <h4 className="player-name">{player.name}</h4>
                                <button
                                  className="remove-player-btn"
                                  onClick={() => handleRemovePlayer(player.id)}
                                  title="Remove player"
                                >
                                  < X />
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

    {playerRemove && (
        <div className="modal-overlay">
        <div className="modal-container delete-modal">
            <button
              className="modal-close delete-modal-close"
              onClick={handleCancelRemovePlayer}
              disabled={removePlayer}
            >
              < X />
            </button>
            <div className="delete-modal-content">
              <div className="delete-modal-message">
            <p>
              Remove {" "}<strong>{playerRemove.name}</strong> {"from this match?"} 
            </p>
          </div>
          <div className="delete-modal-actions">
            <button
              type="button"
              className="delete-modal-button delete-modal-button-cancel"
              onClick={handleCancelRemovePlayer}
              disabled={removePlayer}
            >
              No
            </button>
            <button
              type="button"
              className="delete-modal-button delete-modal-button-confirm"
              onClick={handleConfirmRemovePlayer}
              disabled={removePlayer}
            >
              {removePlayer ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Removing...
                </span>
              ) : (
                "Yes"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
      )}
    </>
  );
}