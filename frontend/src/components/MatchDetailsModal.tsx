"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  LayoutGrid,
  Loader2,
  MoreVertical,
  Plus,
  Trash2,
  Upload,
  Wallet,
} from "lucide-react";
import Modal from "./ui/Modal";
import ConfirmModal from "./ConfirmModal";
import ErrorModal from "./ErrorModal";
import SelectPlayersModal, {
  PlayerOption,
  getAvatarGradient,
  getInitials,
} from "./SelectPlayersModal";
import { authFetch } from "@/lib/authFetch";
import { Match, Player, PaymentStatus } from "@/types/types";
import { exportPlayerList } from "@/utils/playerExport";

type PlayerInMatch = Player & {
  paymentStatus: PaymentStatus;
  playCount: number;
};

const IDR_FORMATTER = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
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

    return `${startTime} – ${endTime} (${roundedDuration} hrs)`;
  } catch (error) {
    console.error("Error formatting time with duration:", error);
    return timeString;
  }
};

interface MatchDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  onMatchUpdate?: () => void;
  onEdit?: (match: Match) => void;
}

export default function MatchDetailsModal({
  isOpen,
  onClose,
  match,
  onMatchUpdate,
  onEdit,
}: MatchDetailsModalProps) {
  const [players, setPlayers] = useState<PlayerInMatch[]>([]);
  const [allAvailablePlayers, setAllAvailablePlayers] = useState<PlayerOption[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [isSelectPlayersModalOpen, setIsSelectPlayersModalOpen] = useState(false);
  const [playerToRemove, setPlayerToRemove] = useState<{ id: string; name: string } | null>(null);
  const [isRemovingPlayer, setIsRemovingPlayer] = useState(false);
  const [playerMenuOpen, setPlayerMenuOpen] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    title: "",
    message: "",
  });

  const matchId = match?.id;
  const isCompleted = match?.status?.toUpperCase() === "COMPLETED";

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
        matchData.players?.map(
          (matchPlayer: {
            player: Player & { playCount?: number };
            paymentStatus: PaymentStatus;
          }) => ({
            ...matchPlayer.player,
            paymentStatus: matchPlayer.paymentStatus,
            playCount: matchPlayer.player.playCount ?? 0,
          })
        ) ?? [];
      setPlayers(matchPlayers);
    } catch (error) {
      console.error("Error fetching match players:", error);
      setPlayers([]);
    } finally {
      setIsLoadingPlayers(false);
    }
  }, [matchId]);

  const fetchAllPlayers = useCallback(async () => {
    try {
      const response = await authFetch("/api/players?latest=true");
      if (response.ok) {
        const data = await response.json();
        setAllAvailablePlayers(data);
      }
    } catch (error) {
      console.error("Error fetching all players:", error);
    }
  }, []);

  useEffect(() => {
    if (isOpen && matchId) {
      fetchCurrentPlayers();
      fetchAllPlayers();
    } else if (!isOpen) {
      setPlayers([]);
      setPlayerToRemove(null);
      setIsRemovingPlayer(false);
      setIsSelectPlayersModalOpen(false);
      setPlayerMenuOpen(null);
    }
  }, [isOpen, matchId, fetchCurrentPlayers, fetchAllPlayers]);

  const handleSaveSelectedPlayers = async (newSelectedIds: string[]) => {
    if (!matchId) return;

    const currentIds = players.map((p) => p.id);
    const toAdd = newSelectedIds.filter((id) => !currentIds.includes(id));
    const toRemove = currentIds.filter((id) => !newSelectedIds.includes(id));

    try {
      // Add newly selected players
      for (const playerId of toAdd) {
        await authFetch(`/api/matches/${matchId}/players`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId }),
        });
      }

      // Remove deselected players
      for (const playerId of toRemove) {
        await authFetch(`/api/matches/${matchId}/players/${playerId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });
      }

      await fetchCurrentPlayers();
      await fetchAllPlayers();
      onMatchUpdate?.();
    } catch (err) {
      console.error("Error updating match players:", err);
      setErrorModal({
        isOpen: true,
        title: "Error",
        message: "Failed to update match players.",
      });
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
        await fetchAllPlayers();
        onMatchUpdate?.();
        setPlayerToRemove(null);
      } else {
        console.error("Failed to remove player from match.");
        setErrorModal({
          isOpen: true,
          title: "Error",
          message: "Failed to remove player. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error removing player:", error);
      setErrorModal({
        isOpen: true,
        title: "Error",
        message: "An unexpected error occurred while removing the player.",
      });
    } finally {
      setIsRemovingPlayer(false);
    }
  };

  const handleSetPaymentStatus = async (playerId: string, newPaymentStatus: PaymentStatus) => {
    try {
      if (!matchId) return;

      // Optimistic update
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === playerId ? { ...p, paymentStatus: newPaymentStatus } : p
        )
      );

      const response = await authFetch(`/api/matches/${matchId}/players/${playerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentStatus: newPaymentStatus }),
      });

      if (response.ok) {
        onMatchUpdate?.();
      } else {
        await fetchCurrentPlayers();
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
      await fetchCurrentPlayers();
    }
  };

  if (!isOpen || !match) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2.5">
            <Calendar className="text-gray-400" size={20} />
            <span>Match Details</span>
          </div>
        }
        size="2xl"
        footer={
          <>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#232730] bg-[#161a22] px-5 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-gray-800 hover:text-white"
            >
              Close
            </button>
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(match)}
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
              >
                Edit Match
              </button>
            )}
          </>
        }
      >
        <div className="space-y-4">
          {/* Top Banner: Venue Title, Date, and Status Badge */}
          <div className="flex flex-col gap-3 rounded-2xl border border-[#232730] bg-[#0c0e12] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                <Calendar size={22} />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-base font-bold text-white sm:text-lg">
                  {match.location || match.title}
                </h3>
                <p className="mt-0.5 text-xs text-gray-400">
                  {formatDate(match.date)}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {isCompleted ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 size={13} />
                  COMPLETED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                  <Clock size={13} />
                  UPCOMING
                </span>
              )}
            </div>
          </div>

          {/* 3 Metric Cards: Court No., Time, Court Fee */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Court No */}
            <div className="flex items-center gap-3 rounded-2xl border border-[#232730] bg-[#0c0e12] p-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#232730] bg-[#161a22] text-gray-400">
                <LayoutGrid size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  COURT NO.
                </p>
                <p className="truncate text-sm font-bold text-white">
                  {match.courtNumber || "—"}
                </p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-center gap-3 rounded-2xl border border-[#232730] bg-[#0c0e12] p-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#232730] bg-[#161a22] text-gray-400">
                <Clock size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  TIME
                </p>
                <p className="truncate text-sm font-bold text-white">
                  {formatTimeWithDuration(match.time)}
                </p>
              </div>
            </div>

            {/* Court Fee */}
            <div className="flex items-center gap-3 rounded-2xl border border-[#232730] bg-[#0c0e12] p-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#232730] bg-[#161a22] text-gray-400">
                <Wallet size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  COURT FEE
                </p>
                <p className="truncate text-sm font-bold text-emerald-400">
                  {formatCurrency(match.fee)}
                </p>
              </div>
            </div>
          </div>

          {/* Description (if provided) */}
          {match.description && (
            <div className="rounded-2xl border border-[#232730] bg-[#0c0e12] p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                DESCRIPTION
              </p>
              <p className="mt-1 text-xs text-gray-300 leading-relaxed">
                {match.description}
              </p>
            </div>
          )}

          {/* Players Section */}
          <div className="space-y-3 pt-1">
            {/* Header with Export and Add Players */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">
                  Players ({players.length})
                </h4>
                <p className="text-xs text-gray-400">
                  Players who joined this match
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportPlayerList(match, players)}
                  className="flex items-center gap-1.5 rounded-xl border border-[#232730] bg-[#161a22] px-3.5 py-1.5 text-xs font-medium text-gray-300 transition hover:border-gray-600 hover:bg-[#202632] hover:text-white"
                >
                  <Upload size={14} />
                  <span>Export Players</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSelectPlayersModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500 shadow-sm"
                >
                  <Plus size={14} />
                  <span>+ Add Players</span>
                </button>
              </div>
            </div>

            {/* Players Grid */}
            {isLoadingPlayers ? (
              <div className="flex flex-col items-center justify-center py-10 text-xs text-gray-400">
                <Loader2 size={24} className="animate-spin text-blue-500 mb-2" />
                <span>Loading players...</span>
              </div>
            ) : players.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#232730] bg-[#0c0e12] py-8 text-center">
                <p className="text-sm font-semibold text-white">
                  No players joined yet
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  Click &ldquo;+ Add Players&rdquo; to add players to this match.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {players.map((player) => {
                  const isBelumSetor = player.paymentStatus === "BELUM_SETOR";
                  const isSudahSetor = player.paymentStatus === "SUDAH_SETOR";

                  return (
                    <div
                      key={player.id}
                      className="relative flex items-center justify-between rounded-2xl border border-[#232730] bg-[#0c0e12] p-3 transition hover:border-gray-700"
                    >
                      {/* Player Avatar and Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ${getAvatarGradient(player.name)}`}
                        >
                          {getInitials(player.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {player.name}
                          </p>
                          {/* Payment Status Buttons */}
                          <div className="mt-1 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSetPaymentStatus(player.id, "BELUM_SETOR")}
                              className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase transition ${
                                isBelumSetor
                                  ? "border border-red-500/40 bg-red-500/20 text-red-400"
                                  : "border border-transparent bg-[#181d26] text-gray-400 hover:text-gray-200"
                              }`}
                            >
                              BELUM SETOR
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetPaymentStatus(player.id, "SUDAH_SETOR")}
                              className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase transition ${
                                isSudahSetor
                                  ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
                                  : "border border-transparent bg-[#181d26] text-gray-400 hover:text-gray-200"
                              }`}
                            >
                              SUDAH SETOR
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Dropdown Options */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setPlayerMenuOpen(
                              playerMenuOpen === player.id ? null : player.id
                            )
                          }
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-800 hover:text-white"
                          aria-label={`Options for ${player.name}`}
                        >
                          <MoreVertical size={16} />
                        </button>

                        {playerMenuOpen === player.id && (
                          <div className="absolute right-0 top-8 z-30 w-32 rounded-xl border border-[#232730] bg-[#161a22] p-1 shadow-xl">
                            <button
                              type="button"
                              onClick={() => {
                                setPlayerMenuOpen(null);
                                handleRemovePlayer(player.id);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 size={13} />
                              <span>Remove</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Select Players Modal for existing matches */}
      <SelectPlayersModal
        isOpen={isSelectPlayersModalOpen}
        onClose={() => setIsSelectPlayersModalOpen(false)}
        selectedPlayerIds={players.map((p) => p.id)}
        onSave={handleSaveSelectedPlayers}
        availablePlayers={allAvailablePlayers}
        onPlayerCreated={(newPlayer) => {
          setAllAvailablePlayers((prev) => [...prev, newPlayer]);
        }}
      />

      <ConfirmModal
        isOpen={Boolean(playerToRemove)}
        onClose={handleCancelRemovePlayer}
        onConfirm={handleConfirmRemovePlayer}
        title="Remove Player"
        message={
          <p>
            Remove <strong>{playerToRemove?.name ?? "this player"}</strong> from this match?
          </p>
        }
        confirmLabel={isRemovingPlayer ? "Removing..." : "Remove"}
        cancelLabel="Cancel"
        isLoading={isRemovingPlayer}
        confirmVariant="destructive"
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
