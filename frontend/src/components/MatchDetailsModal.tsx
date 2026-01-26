"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, X, FileText } from "lucide-react";
import { Button } from "./ui/button";
import ConfirmModal from "./ConfirmModal";
import ErrorModal from "./ErrorModal";
import { authFetch } from "@/lib/authFetch";
import { Match, Player, PaymentStatus } from "@/types/types";
import { exportPlayerList } from "@/utils/playerExport";

type PlayerInMatch = Player & {
  paymentStatus: PaymentStatus;
};

const IDR_FORMATTER = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const year = date.getFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
};

const formatCurrency = (amount: number) => IDR_FORMATTER.format(amount);

const formatTimeWithDuration = (timeString: string) => {
  if (!timeString || !timeString.includes("-")) {
    return timeString;
  }

  try {
    const [startTime, endTime] = timeString.split("-").map((time) => time.trim());
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);

    if (
      Number.isNaN(startHours) ||
      Number.isNaN(startMinutes) ||
      Number.isNaN(endHours) ||
      Number.isNaN(endMinutes)
    ) {
      return timeString;
    }

    const startDate = new Date();
    startDate.setHours(startHours, startMinutes, 0, 0);

    const endDate = new Date();
    endDate.setHours(endHours, endMinutes, 0, 0);

    let durationMillis = endDate.getTime() - startDate.getTime();
    if (durationMillis < 0) {
      durationMillis += 24 * 60 * 60 * 1000;
    }

    const durationHours = durationMillis / (1000 * 60 * 60);
    const roundedDuration = Math.round(durationHours * 10) / 10;

    return `${startTime}-${endTime} (${roundedDuration} hrs)`;
  } catch (error) {
    console.error("Error formatting time with duration:", error);
    return timeString;
  }
};

const deduplicatePlayers = <T extends Player>(playersList: T[]): T[] => {
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const deduplicatedPlayers: T[] = [];

  for (const player of playersList) {
    const trimmedName = player.name.trim();
    const normalizedName = trimmedName.toLowerCase();

    if (seenIds.has(player.id) || seenNames.has(normalizedName)) continue;

    seenIds.add(player.id);
    seenNames.add(normalizedName);
    deduplicatedPlayers.push({ ...player, name: trimmedName });
  }

  return deduplicatedPlayers;
};

const sortPlayersByPaymentStatus = (players: PlayerInMatch[]) => {
  return [...players].sort((a, b) => {
    if (a.paymentStatus === "SUDAH_SETOR" && b.paymentStatus === "BELUM_SETOR") return -1;
    if (a.paymentStatus === "BELUM_SETOR" && b.paymentStatus === "SUDAH_SETOR") return 1;
    return 0;
  });
};

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
  const [players, setPlayers] = useState<PlayerInMatch[]>([]);
  const [pastPlayers, setPastPlayers] = useState<Player[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [isLoadingPastPlayers, setIsLoadingPastPlayers] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [playerToRemove, setPlayerToRemove] = useState<{ id: string; name: string } | null>(null);
  const [existingPlayerSearch, setExistingPlayerSearch] = useState("");
  const [isRemovingPlayer, setIsRemovingPlayer] = useState(false);
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    title: "",
    message: "",
  });

  const matchId = match?.id;

  const fetchCurrentPlayers = useCallback(async () => {
    if (!matchId) return;

    setIsLoadingPlayers(true);
    try {
      const response = await authFetch(`/api/matches/${matchId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch match players.");
      }

      const matchData = await response.json();
      const matchPlayers =
        matchData.players?.map((matchPlayer: { player: Player; paymentStatus: PaymentStatus }) => ({
          ...matchPlayer.player,
          paymentStatus: matchPlayer.paymentStatus,
        })) ?? [];
      setPlayers(matchPlayers);
    } catch (error) {
      console.error("Error fetching match players:", error);
      setPlayers([]);
    } finally {
      setIsLoadingPlayers(false);
    }
  }, [matchId]);

  const fetchPastPlayers = useCallback(async () => {
    if (!matchId) return;

    setIsLoadingPastPlayers(true);
    setPastPlayers([]);
    try {
      const response = await authFetch(`/api/matches/${matchId}/players/past`);
      if (!response.ok) {
        throw new Error("Failed to fetch players.");
      }

      const data = (await response.json()) as Player[];
      setPastPlayers(deduplicatePlayers(data));
    } catch (error) {
      console.error("Error fetching players:", error);
      setPastPlayers([]);
    } finally {
      setIsLoadingPastPlayers(false);
    }
  }, [matchId]);

  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      return () => {
        const storedScrollY = document.body.style.top;
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        if (storedScrollY) {
          window.scrollTo(0, Number.parseInt(storedScrollY, 10) * -1);
        }
      };
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && matchId) {
      fetchCurrentPlayers();
      fetchPastPlayers();
    } else if (!isOpen) {
      setPlayers([]);
      setPastPlayers([]);
      setShowAddPlayer(false);
      setNewPlayerName("");
      setPlayerToRemove(null);
      setIsRemovingPlayer(false);
      setExistingPlayerSearch("");
    }
  }, [isOpen, matchId, fetchCurrentPlayers, fetchPastPlayers]);

  useEffect(() => {
    if (!showAddPlayer) {
      setExistingPlayerSearch("");
    }
  }, [showAddPlayer]);

  const handleAddPlayer = async (playerId: string) => {
    if (!matchId) return;

    try {
      const resetResponse = await authFetch(`/api/players/${playerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "ACTIVE" }),
      });

      if (!resetResponse.ok) {
        console.error("Failed to reset player status.");
      }

      const response = await authFetch(`/api/matches/${matchId}/players`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerId }),
      });

      if (response.ok) {
        await fetchCurrentPlayers();
        await fetchPastPlayers();
        onMatchUpdate?.();
        setExistingPlayerSearch("");
      }
    } catch (error) {
      console.error("Error adding player:", error);
    }
  };

  const handleRemovePlayer = (playerId: string) => {
    const player = players.find((currentPlayer) => currentPlayer.id === playerId);
    setPlayerToRemove({ id: playerId, name: player ? player.name : "this player" });
    setIsRemovingPlayer(false);
  };

  const handleCancelRemovePlayer = () => {
    if (isRemovingPlayer) return;
    setPlayerToRemove(null);
  };

  const handleConfirmRemovePlayer = async () => {
    if (!matchId || !playerToRemove) return;

    setIsRemovingPlayer(true);
    try {
      const response = await authFetch(`/api/matches/${matchId}/players/${playerToRemove.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        await fetchCurrentPlayers();
        await fetchPastPlayers();
        onMatchUpdate?.();
        setPlayerToRemove(null);
      } else {
        console.error("Failed to remove player from match.");
        window.alert("Failed to remove player. Please try again.");
      }
    } catch (error) {
      console.error("Error removing player:", error);
      window.alert("An unexpected error occurred while removing the player.");
    } finally {
      setIsRemovingPlayer(false);
    }
  };

  const handleCreateAndAddPlayer = async () => {
    if (!newPlayerName.trim() || !matchId) return;

    try {
      const createResponse = await authFetch("/api/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newPlayerName.trim(),
          status: "ACTIVE",
        }),
      });

      if (createResponse.status === 409) {
        setErrorModal({
          isOpen: true,
          title: "Oops!",
          message: "Player with this name already exists.",
        });
        return;
      }

      if (!createResponse.ok) {
        throw new Error(`Failed to create player. Status : ${createResponse.status}`);
      }

      const newPlayer = await createResponse.json();
      await handleAddPlayer(newPlayer.id);
      setNewPlayerName("");
      setShowAddPlayer(false);
    } catch (error) {
      console.error("Error creating player:", error);
      setErrorModal({
        isOpen: true,
        title: "Unable to create player",
        message: "Please try again.",
      });
    }
  };

  const handleSetPaymentStatus = async (playerId: string, newPaymentStatus: PaymentStatus) => {
    try {
      if (!matchId) return;

      const response = await authFetch(`/api/matches/${matchId}/players/${playerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentStatus: newPaymentStatus }),
      });

      if (response.ok) {
        await fetchCurrentPlayers();
        onMatchUpdate?.();
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
    }
  };

  const availablePastPlayers = useMemo(
    () => pastPlayers.filter((pastPlayer) => !players.some((player) => player.id === pastPlayer.id)),
    [pastPlayers, players],
  );

  const filteredExistingPlayers = useMemo(() => {
    const searchTerm = existingPlayerSearch.trim().toLowerCase();

    if (!searchTerm) {
      return availablePastPlayers;
    }

    const filtered = availablePastPlayers.filter((player) =>
      player.name.toLowerCase().includes(searchTerm),
    );

    return filtered.sort((playerA, playerB) => {
      const nameA = playerA.name.toLowerCase();
      const nameB = playerB.name.toLowerCase();

      if (nameA === searchTerm && nameB !== searchTerm) return -1;
      if (nameB === searchTerm && nameA !== searchTerm) return 1;

      const aStartsWith = nameA.startsWith(searchTerm);
      const bStartsWith = nameB.startsWith(searchTerm);
      if (aStartsWith && !bStartsWith) return -1;
      if (bStartsWith && !aStartsWith) return 1;

      return nameA.localeCompare(nameB);
    });
  }, [availablePastPlayers, existingPlayerSearch]);

  const isPlayerAlreadyInMatch = useMemo(() => {
    const searchTerm = existingPlayerSearch.trim().toLowerCase();

    if (!searchTerm) {
      return false;
    }

    return players.some((player) => player.name.toLowerCase().includes(searchTerm));
  }, [existingPlayerSearch, players]);

  const sortedPlayers = useMemo(
    () => sortPlayersByPaymentStatus(players),
    [players],
  );

  if (!isOpen || !match) return null;

  return (
    <>
      <div className="modal-overlay">
        <div className="match-details-modal">
          <div className="modal-header">
            <h2>Match Details</h2>
            <div className="modal-header-actions">
              <Button variant="ghost" size="icon" className="modal-close" onClick={onClose} aria-label="Close match details">
                <X />
              </Button>
            </div>
          </div>

          <div className="match-details-content">
            <div className="match-info-section">
              <div className="match-title-with-status">
                <h3 className="match-details-title">
                  {match.location} - {formatDate(match.date)}
                </h3>
                <span className={`status-badge ${match.status.toLowerCase()}`}>{match.status}</span>
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
                  <span className="detail-value fee-value">{formatCurrency(match.fee)}</span>
                </div>
              </div>
              {match.description && (
                <div className="match-description">
                  <span className="detail-label">Description:</span>
                  <p>{match.description}</p>
                </div>
              )}
            </div>

            <div className="players-section">
              <div className="players-header">
                <h3>Players ({players.length})</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="export-pdf-btn"
                    onClick={() => exportPlayerList(match, players)}
                    title="Export Players to PDF"
                  >
                    <FileText size={18} />
                    Export Players
                  </Button>
                  <Button className="add-player-btn" onClick={() => setShowAddPlayer((value) => !value)}>
                    + Add Player
                  </Button>
                </div>
              </div>

              {showAddPlayer && (
                <div className="add-player-section">
                  <div className="add-player-options">
                    <h4>Existing Player</h4>
                    <div className="existing-player-search">
                      <input
                        type="text"
                        placeholder="Search existing players..."
                        value={existingPlayerSearch}
                        onChange={(event) => setExistingPlayerSearch(event.target.value)}
                        className="form-input"
                        aria-label="Search existing players"
                      />

                      {isLoadingPastPlayers ? (
                        <div className="existing-player-dropdown" role="status">
                          <div className="existing-player-loading">
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            <span>Loading players...</span>
                          </div>
                        </div>
                      ) : existingPlayerSearch.trim() ? (
                        filteredExistingPlayers.length > 0 ? (
                          <div className="existing-player-dropdown" role="listbox">
                            <ul className="existing-player-options">
                              {filteredExistingPlayers.map((player) => (
                                <li key={player.id}>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="existing-player-option"
                                    onClick={() => handleAddPlayer(player.id)}
                                    aria-label={`Add ${player.name} to this match`}
                                  >
                                    {player.name}
                                  </Button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <div className="existing-player-dropdown existing-player-empty">
                            <p className="no-players">
                              {isPlayerAlreadyInMatch ? "Player is in the match." : "No matching players found."}
                            </p>
                          </div>
                        )
                      ) : availablePastPlayers.length > 0 ? (
                        <p className="existing-player-hint">If player exists in the match, click on the player to add them to the match.</p>
                      ) : (
                        <p className="no-players">No players found.</p>
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
                        onChange={(event) => setNewPlayerName(event.target.value)}
                        className="form-input"
                      />
                      <Button
                        className="create-player-btn"
                        onClick={handleCreateAndAddPlayer}
                        disabled={!newPlayerName.trim()}
                      >
                        Create and Add Player
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {isLoadingPlayers ? (
                <div className="no-players-message flex flex-col items-center justify-center">
                  <p>Loading players...</p>
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500 mt-2" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {sortedPlayers.length > 0 ? (
                    sortedPlayers.map((player) => (
                      <div key={player.id} className="player-card">
                        <div className="player-header">
                          <h4 className="player-name">{player.name}</h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="remove-player-btn"
                            onClick={() => handleRemovePlayer(player.id)}
                            title="Remove player"
                            aria-label={`Remove ${player.name} from this match`}
                          >
                            <X />
                          </Button>
                        </div>
                        <div className="player-status-controls">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`payment-btn ${player.paymentStatus === "BELUM_SETOR" ? "belum-setor" : "no-color"
                              }`}
                            onClick={() => handleSetPaymentStatus(player.id, "BELUM_SETOR")}
                          >
                            BELUM SETOR
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`payment-btn ${player.paymentStatus === "SUDAH_SETOR" ? "sudah-setor" : "no-color"
                              }`}
                            onClick={() => handleSetPaymentStatus(player.id, "SUDAH_SETOR")}
                          >
                            SUDAH SETOR
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-players-message col-span-2">
                      <p>No players added to this match yet.</p>
                      <p>Click &quot;Add Player&quot; to get started!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(playerToRemove)}
        onClose={handleCancelRemovePlayer}
        onConfirm={handleConfirmRemovePlayer}
        message={
          playerToRemove ? (
            <p>
              Remove <strong>{playerToRemove.name}</strong> from this match?
            </p>
          ) : undefined
        }
        confirmLabel={
          isRemovingPlayer ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Removing...
            </span>
          ) : (
            "Yes"
          )
        }
        cancelLabel="No"
        isLoading={isRemovingPlayer}
        containerClassName="delete-modal"
        closeButtonClassName="delete-modal-close"
        contentClassName="delete-modal-content"
        messageClassName="delete-modal-message"
        actionsClassName="delete-modal-actions"
        cancelButtonClassName="delete-modal-button delete-modal-button-cancel"
        confirmButtonClassName="delete-modal-button delete-modal-button-confirm"
      />
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, title: "", message: "" })}
        title={errorModal.title}
        message={errorModal.message}
      />
    </>
  );
}
