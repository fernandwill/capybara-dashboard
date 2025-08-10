'use client';

import { useState, useEffect, useCallback } from 'react';

interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
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

export default function MatchDetailsModal({ isOpen, onClose, match }: MatchDetailsModalProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Fetch match players
  const fetchMatchPlayers = useCallback(async () => {
    if (!match) return;
    try {
      const response = await fetch(`http://localhost:8000/api/matches/${match.id}`);
      if (response.ok) {
        const matchData = await response.json();
        // Extract players from match data (assuming players are in matchPlayers relation)
        const matchPlayers = matchData.players?.map((mp: { player: Player }) => mp.player) || [];
        setPlayers(matchPlayers);
      }
    } catch (error) {
      console.error('Error fetching match players:', error);
    }
  }, [match]);

  // Fetch all players for adding
  const fetchAllPlayers = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/players');
      if (response.ok) {
        const data = await response.json();
        setAllPlayers(data);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  // Add player to match
  const handleAddPlayer = async (playerId: string) => {
    if (!match) return;
    try {
      const response = await fetch(`http://localhost:8000/api/matches/${match.id}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerId }),
      });

      if (response.ok) {
        fetchMatchPlayers(); // Refresh players list
        setShowAddPlayer(false);
      }
    } catch (error) {
      console.error('Error adding player:', error);
    }
  };

  // Remove player from match
  const handleRemovePlayer = async (playerId: string) => {
    if (!match) return;
    try {
      const response = await fetch(`http://localhost:8000/api/matches/${match.id}/players/${playerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMatchPlayers(); // Refresh players list
      }
    } catch (error) {
      console.error('Error removing player:', error);
    }
  };

  // Create new player and add to match
  const handleCreateAndAddPlayer = async () => {
    if (!newPlayerName.trim() || !match) return;
    
    try {
      // First create the player
      const createResponse = await fetch('http://localhost:8000/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newPlayerName.trim(),
          status: 'ACTIVE',
          paymentStatus: 'BELUM_SETOR'
        }),
      });

      if (createResponse.ok) {
        const newPlayer = await createResponse.json();
        // Then add to match
        await handleAddPlayer(newPlayer.id);
        setNewPlayerName('');
        fetchAllPlayers(); // Refresh all players list
      }
    } catch (error) {
      console.error('Error creating player:', error);
    }
  };

  // Toggle player payment status
  const handleTogglePayment = async (playerId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'BELUM_SETOR' ? 'SUDAH_SETOR' : 'BELUM_SETOR';
    
    try {
      const response = await fetch(`http://localhost:8000/api/players/${playerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });

      if (response.ok) {
        fetchMatchPlayers(); // Refresh players list
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  // Toggle player status
  const handleToggleStatus = async (playerId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'TENTATIVE' : 'ACTIVE';
    
    try {
      const response = await fetch(`http://localhost:8000/api/players/${playerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchMatchPlayers(); // Refresh players list
      }
    } catch (error) {
      console.error('Error updating player status:', error);
    }
  };

  useEffect(() => {
    if (isOpen && match) {
      fetchMatchPlayers();
      fetchAllPlayers();
    }
  }, [isOpen, match, fetchMatchPlayers]);

  if (!isOpen || !match) return null;

  // Filter available players (not already in match)
  const availablePlayers = allPlayers.filter(
    player => !players.some(matchPlayer => matchPlayer.id === player.id)
  );

  return (
    <div className="modal-overlay">
      <div className="match-details-modal">
        <div className="modal-header">
          <h2>Match Details</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="match-details-content">
          {/* Match Information */}
          <div className="match-info-section">
            <h3 className="match-details-title">{match.title}</h3>
            <div className="match-details-grid">
              <div className="detail-item">
                <span className="detail-label">Location:</span>
                <span className="detail-value">📍 {match.location}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Court:</span>
                <span className="detail-value">#{match.courtNumber}</span>
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
                <span className="detail-value fee-value">{formatCurrency(match.fee)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className={`status-badge ${match.status.toLowerCase()}`}>
                  {match.status}
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
                  <div className="existing-players">
                    <h4>Add Existing Player:</h4>
                    <div className="existing-players-list">
                      {availablePlayers.length > 0 ? (
                        availablePlayers.map(player => (
                          <button
                            key={player.id}
                            className="existing-player-btn"
                            onClick={() => handleAddPlayer(player.id)}
                          >
                            {player.name}
                          </button>
                        ))
                      ) : (
                        <p className="no-players">No available players</p>
                      )}
                    </div>
                  </div>
                  <div className="new-player">
                    <h4>Create New Player:</h4>
                    <div className="new-player-form">
                      <input
                        type="text"
                        placeholder="Player name"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        className="form-input"
                      />
                      <button
                        className="create-player-btn"
                        onClick={handleCreateAndAddPlayer}
                        disabled={!newPlayerName.trim()}
                      >
                        Create & Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Players Grid */}
            <div className="players-grid">
              {players.length > 0 ? (
                players.map(player => (
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
                    <div className="player-details">
                      {player.email && (
                        <div className="player-detail">
                          <span>📧 {player.email}</span>
                        </div>
                      )}
                      {player.phone && (
                        <div className="player-detail">
                          <span>📱 {player.phone}</span>
                        </div>
                      )}
                    </div>
                    <div className="player-status-buttons">
                      <button
                        className={`status-toggle ${player.status.toLowerCase()}`}
                        onClick={() => handleToggleStatus(player.id, player.status)}
                      >
                        {player.status}
                      </button>
                      <button
                        className={`payment-toggle ${player.paymentStatus.toLowerCase()}`}
                        onClick={() => handleTogglePayment(player.id, player.paymentStatus)}
                      >
                        {player.paymentStatus === 'BELUM_SETOR' ? 'Belum Setor' : 'Sudah Setor'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-players-message">
                  <p>No players added to this match yet.</p>
                  <p>Click &quot;Add Player&quot; to get started!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}