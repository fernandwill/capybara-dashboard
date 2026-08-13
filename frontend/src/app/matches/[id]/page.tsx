"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import {
  IconArrowLeft,
  IconCalendar,
  IconCircleCheck,
  IconChevronRight,
  IconClock,
  IconLoader,
  IconMapPin,
  IconRotate,
} from "@tabler/icons-react";
import AppLayout from "@/components/layout/AppLayout";
import SelectPlayersModal from "@/components/SelectPlayersModal";
import ErrorModal from "@/components/ErrorModal";
import SuccessModal from "@/components/SuccessModal";
import CourtManagementHeader from "@/components/match/CourtManagementHeader";
import CourtCard from "@/components/match/CourtCard";
import PlayerPriorityCard from "@/components/match/PlayerPriorityCard";
import MatchHistoryCard from "@/components/match/MatchHistoryCard";
import SlotPickerModal, {
  SlotPickerState,
} from "@/components/match/SlotPickerModal";
import { useCourtManager } from "@/hooks/use-court-manager";
import { usePlayers } from "@/hooks/use-players";
import { authFetch } from "@/lib/auth-fetch";
import { Match, Player, ModalState } from "@/types/types";
import { formatDate, formatTimeWithDuration } from "@/utils/formatters";
import { exportPlayerList } from "@/utils/player-export";
import type { PlayerInMatch, FinishedGameHistory } from "@/types/match-types";

// Shape returned by GET /api/matches/:id (match + per-match play counts +
// persisted round history).
interface MatchDetail extends Match {
  rounds: Array<{
    id: string;
    courtNumber: number;
    teamAPlayerIds: string[];
    teamBPlayerIds: string[];
    finishedAt: string;
  }>;
}

export default function MatchDetailsPage() {
  const params = useParams();
  const matchId = params?.id as string;

  // Match data — SWR-backed. The detail key lives in the shared cache, so
  // revisiting a match (or navigating from another page) renders instantly;
  // realtime revalidates it when the match, roster, or payments change.
  // keepPreviousData is disabled so navigating between matches shows a loader
  // instead of flashing the previous match.
  const {
    data: matchData,
    isLoading,
    error: matchError,
    mutate: revalidateMatch,
  } = useSWR<MatchDetail>(
    matchId ? `/api/matches/${matchId}` : null,
    { keepPreviousData: false }
  );
  const match = matchData ?? null;

  // All available players for the roster picker — shared cache with the
  // players page and dashboard insights.
  const { players: allAvailablePlayers, fetchPlayers: refreshPlayers } = usePlayers();

  // Local, interactive-only state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [activeMobileCourtIndex, setActiveMobileCourtIndex] = useState(0);
  const [slotPicker, setSlotPicker] = useState<SlotPickerState | null>(null);

  // Toast / Feedback modals
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
  const [isSelectPlayersModalOpen, setIsSelectPlayersModalOpen] = useState(false);

  // Court management state (grid, assignments, finish-round persistence).
  const courtManager = useCourtManager({
    matchId,
    onAutoAssignEmpty: () => {
      setErrorModal({
        isOpen: true,
        title: "No Available Players",
        message:
          "All joined players are already assigned to courts or no players in match.",
      });
    },
    onFinishError: () => {
      setErrorModal({
        isOpen: true,
        title: "Save Failed",
        message: "Could not save this round. Please try again.",
      });
    },
  });
  const { ensureCourtsForMatch } = courtManager;

  // In-match players enriched with per-match play counts (server truth).
  const players = useMemo<PlayerInMatch[]>(() => {
    return (matchData?.players ?? []).map((matchPlayer) => {
      const p = matchPlayer.player as Player & { playCount?: number };
      return {
        ...p,
        paymentStatus: matchPlayer.paymentStatus,
        playCount: p.playCount ?? 0,
      };
    });
  }, [matchData]);

  // Session play counts start at the per-match server values; the Finish
  // Court flow revalidates so the incremented counts come back authoritative.
  const sessionPlayCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    players.forEach((p) => {
      counts[p.id] = p.playCount ?? 0;
    });
    return counts;
  }, [players]);

  // Persisted round history, mapped to display names (survives reloads).
  const gameHistory = useMemo<FinishedGameHistory[]>(() => {
    return (matchData?.rounds ?? []).map(
      (round: {
        id: string;
        courtNumber: number;
        teamAPlayerIds: string[];
        teamBPlayerIds: string[];
        finishedAt: string;
      }) => ({
        id: round.id,
        courtName: `Court ${round.courtNumber}`,
        teamANames: (round.teamAPlayerIds ?? []).map(
          (pid) => players.find((p) => p.id === pid)?.name || "Player"
        ),
        teamBNames: (round.teamBPlayerIds ?? []).map(
          (pid) => players.find((p) => p.id === pid)?.name || "Player"
        ),
        finishedAt: round.finishedAt,
      })
    );
  }, [matchData, players]);

  // Initialize the court slots once per match (courts are local interactive
  // state, so background revalidations must not reset them).
  useEffect(() => {
    if (matchData) {
      ensureCourtsForMatch(matchData.id, matchData.courtNumber);
    }
  }, [matchData, ensureCourtsForMatch]);

  // Surface a first-load failure (e.g. match deleted) as an error modal once.
  useEffect(() => {
    if (matchError && !matchData) {
      setErrorModal({
        isOpen: true,
        title: "Error",
        message: "Failed to load match details. Please return to the dashboard.",
      });
    }
  }, [matchError, matchData]);

  // Players prioritized by in-session play counts ascending
  const prioritizedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      const countA = sessionPlayCounts[a.id] ?? a.playCount ?? 0;
      const countB = sessionPlayCounts[b.id] ?? b.playCount ?? 0;
      if (countA !== countB) return countA - countB;
      return a.name.localeCompare(b.name);
    });
  }, [players, sessionPlayCounts]);

  // Assigned player IDs currently on any court slot
  const assignedPlayerIds = useMemo(() => {
    const ids = new Set<string>();
    courtManager.courts.forEach((court) => {
      court.teamA.forEach((slot) => slot.playerId && ids.add(slot.playerId));
      court.teamB.forEach((slot) => slot.playerId && ids.add(slot.playerId));
    });
    return ids;
  }, [courtManager.courts]);

  // Unassigned players in queue
  const unassignedPlayers = useMemo(() => {
    return prioritizedPlayers.filter((p) => !assignedPlayerIds.has(p.id));
  }, [prioritizedPlayers, assignedPlayerIds]);

  // Finish Match status toggle
  const handleToggleMatchStatus = async () => {
    if (!match) return;
    const isCompleted = match.status?.toUpperCase() === "COMPLETED";
    const nextStatus = isCompleted ? "UPCOMING" : "COMPLETED";

    setIsUpdatingStatus(true);
    try {
      const res = await authFetch(`/api/matches/${match.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update match status");
      }

      // Optimistically flip the status in the cache; realtime reconciles on
      // the write (matches table change revalidates this detail key).
      await revalidateMatch(
        (current) => (current ? { ...current, status: nextStatus } : current),
        { revalidate: false }
      );

      setSuccessModal({
        isOpen: true,
        title: "Match Updated",
        message:
          nextStatus === "COMPLETED"
            ? "Match marked as Completed! Play counts have been registered."
            : "Match reopened and set to Upcoming.",
      });
    } catch (err) {
      console.error(err);
      setErrorModal({
        isOpen: true,
        title: "Update Failed",
        message: "Could not update match status. Please try again.",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Save player roster changes from SelectPlayersModal
  const handleSaveRoster = async (selectedIds: string[]) => {
    if (!match) return;
    try {
      const res = await authFetch(`/api/matches/${match.id}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerIds: selectedIds }),
      });

      if (!res.ok) throw new Error("Failed to update roster");
      await revalidateMatch();
    } catch (err) {
      console.error(err);
      setErrorModal({
        isOpen: true,
        title: "Roster Update Failed",
        message: "Failed to update match players.",
      });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-96 items-center justify-center">
          <IconLoader size={32} className="animate-spin text-emerald-400" />
        </div>
      </AppLayout>
    );
  }

  if (!match) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-semibold text-app-text-primary">Match not found</p>
          <Link
            href="/matches"
            className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
          >
            Back to Matches
          </Link>
        </div>
      </AppLayout>
    );
  }

  const isMatchCompleted = match.status?.toUpperCase() === "COMPLETED";
  const statusDisplay = isMatchCompleted ? "Completed" : "In Progress";
  const statusPillBg = isMatchCompleted
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    : "bg-blue-500/10 text-blue-400 border-blue-500/20";

  const safeActiveMobileIndex =
    activeMobileCourtIndex >= courtManager.courts.length
      ? 0
      : activeMobileCourtIndex;

  const finishCourt = (courtIndex: number) =>
    courtManager.handleFinishCourt(courtIndex, revalidateMatch);

  return (
    <AppLayout>
      <div className="space-y-6 pb-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-app-text-muted">
          <Link
            href="/matches"
            className="flex items-center gap-1 transition hover:text-app-text-primary"
          >
            <IconArrowLeft size={13} />
            <span>Matches</span>
          </Link>
          <IconChevronRight size={13} className="text-app-text-muted" />
          <span className="truncate font-medium text-app-text-secondary">
            {match.title}
          </span>
        </div>

        {/* Match Header Hero Card */}
        <div className="rounded-2xl border border-app-border bg-app-bg p-5 shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-app-text-primary sm:text-3xl">
                  {match.title}
                </h1>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${statusPillBg}`}
                >
                  {statusDisplay}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-app-text-muted">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1.5">
                    <IconCalendar size={14} className="text-emerald-400" />
                    {formatDate(match.date)}
                  </span>
                  <span className="text-app-text-muted">•</span>
                  <span className="flex items-center gap-1.5">
                    <IconClock size={14} className="text-blue-400" />
                    {formatTimeWithDuration(match.time)}
                  </span>
                </div>
                {match.location && (
                  <div className="flex items-center gap-1.5 text-app-text-secondary">
                    <IconMapPin size={14} className="shrink-0 text-amber-400" />
                    <span className="truncate">{match.location}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => exportPlayerList(match, players)}
                className="flex items-center gap-1.5 rounded-xl border border-app-border bg-app-input px-3.5 py-2 text-xs font-semibold text-app-text-secondary transition hover:border-app-border-hover hover:bg-app-hover hover:text-app-text-primary"
                aria-label="Export Players"
              >
                <span>Export</span>
              </button>

              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={handleToggleMatchStatus}
                aria-label={isMatchCompleted ? "Reopen Match" : "Finish Match"}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold shadow-md transition disabled:opacity-50 ${
                  isMatchCompleted
                    ? "border border-app-border bg-app-input text-app-text-primary hover:bg-app-hover"
                    : "border border-emerald-500/40 bg-emerald-600 hover:bg-emerald-500 text-white"
                }`}
              >
                {isUpdatingStatus ? (
                  <IconLoader size={14} className="animate-spin" />
                ) : isMatchCompleted ? (
                  <IconRotate size={14} />
                ) : (
                  <IconCircleCheck size={14} />
                )}
                <span>{isMatchCompleted ? "Reopen Match" : "Finish Match"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Unified 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Court Management & Courts Grid */}
          <div className="space-y-4 lg:col-span-8">
            <CourtManagementHeader
              onAutoAssign={() =>
                courtManager.handleAutoAssign(unassignedPlayers)
              }
              onResetAll={courtManager.handleResetAllCourts}
            />

            {/* Mobile Court Selector Tabs */}
            <div className="flex overflow-x-auto gap-1.5 rounded-xl bg-app-bg p-1.5 border border-app-border md:hidden no-scrollbar">
              {courtManager.courts.map((c, idx) => {
                const courtHasPlayers =
                  c.teamA.some((s) => s.playerId) ||
                  c.teamB.some((s) => s.playerId);
                const isCurrent = safeActiveMobileIndex === idx;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveMobileCourtIndex(idx)}
                    className={`flex flex-1 min-w-[85px] min-h-[42px] items-center justify-center gap-1.5 rounded-lg py-2 px-2.5 text-xs font-semibold transition active:scale-[0.98] ${
                      isCurrent
                        ? "bg-app-primary text-white shadow-md font-bold"
                        : "bg-app-input text-app-text-muted hover:text-app-text-primary"
                    }`}
                  >
                    <span>{c.name}</span>
                    {courtHasPlayers && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isCurrent ? "bg-white" : "bg-yellow-400"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Courts Grid — On mobile: only active court is shown. On md+: 2 columns */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {courtManager.courts.map((court, courtIdx) => (
                <CourtCard
                  key={court.id}
                  court={court}
                  courtIndex={courtIdx}
                  isActive={safeActiveMobileIndex === courtIdx}
                  players={players}
                  sessionPlayCounts={sessionPlayCounts}
                  isSavingRound={courtManager.isSavingRound}
                  onRemove={courtManager.handleRemoveFromSlot}
                  onOpenSlotPicker={(ci, team, sIdx) =>
                    setSlotPicker({ courtIndex: ci, team, slotIndex: sIdx })
                  }
                  onFinishCourt={finishCourt}
                />
              ))}
            </div>
          </div>

          {/* Right Column: Player Priority & Match History */}
          <div className="space-y-4 lg:col-span-4">
            <PlayerPriorityCard
              players={prioritizedPlayers}
              sessionPlayCounts={sessionPlayCounts}
              assignedPlayerIds={assignedPlayerIds}
            />
            <MatchHistoryCard history={gameHistory} />
          </div>
        </div>
      </div>

      {/* Slot Player Selector Modal */}
      <SlotPickerModal
        slotPicker={slotPicker}
        unassignedPlayers={unassignedPlayers}
        sessionPlayCounts={sessionPlayCounts}
        onClose={() => setSlotPicker(null)}
        onSelect={(ci, team, sIdx, playerId) => {
          courtManager.handleAssignPlayerToSlot(ci, team, sIdx, playerId);
          setSlotPicker(null);
        }}
      />

      {/* Select Players Modal (Roster Management) */}
      <SelectPlayersModal
        isOpen={isSelectPlayersModalOpen}
        onClose={() => setIsSelectPlayersModalOpen(false)}
        selectedPlayerIds={players.map((p) => p.id)}
        onSave={handleSaveRoster}
        availablePlayers={allAvailablePlayers}
        onPlayerCreated={() => {
          // The player is persisted; refresh the shared players cache so the
          // newly created player shows up in the picker (realtime also covers
          // this via the players table change).
          void refreshPlayers();
        }}
      />

      {/* Feedback Modals */}
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() =>
          setSuccessModal({ isOpen: false, title: "", message: "" })
        }
        title={successModal.title}
        message={successModal.message}
      />
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, title: "", message: "" })}
        title={errorModal.title}
        message={errorModal.message}
      />
    </AppLayout>
  );
}
