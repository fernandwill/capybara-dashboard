"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  History,
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
  Users,
  X,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import SelectPlayersModal, {
  PlayerOption,
} from "@/components/SelectPlayersModal";
import ErrorModal from "@/components/ErrorModal";
import SuccessModal from "@/components/SuccessModal";
import { authFetch } from "@/lib/authFetch";
import { Match, Player, PaymentStatus, ModalState } from "@/types/types";
import { exportPlayerList } from "@/utils/playerExport";

interface PlayerInMatch extends Player {
  paymentStatus: PaymentStatus;
  playCount: number;
}

interface CourtSlot {
  playerId: string | null;
}

interface CourtState {
  id: number;
  name: string;
  status: "IN PROGRESS" | "EMPTY" | "COMPLETED";
  teamA: [CourtSlot, CourtSlot];
  teamB: [CourtSlot, CourtSlot];
}

interface FinishedGameHistory {
  id: string;
  courtName: string;
  teamANames: string[];
  teamBNames: string[];
  finishedAt: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const year = date.getFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
};

const formatTimeHM = (isoString: string) => {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
};

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

    return `${startTime} - ${endTime} (${roundedDuration} hrs)`;
  } catch {
    return timeString;
  }
};

export default function MatchDetailsPage() {
  const params = useParams();
  const matchId = params?.id as string;

  // Match and player state
  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<PlayerInMatch[]>([]);
  const [allAvailablePlayers, setAllAvailablePlayers] = useState<PlayerOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSavingRound, setIsSavingRound] = useState(false);

  // Courts state
  const [courts, setCourts] = useState<CourtState[]>([]);

  // In-session player play counts
  const [sessionPlayCounts, setSessionPlayCounts] = useState<Record<string, number>>({});

  // History
  const [gameHistory, setGameHistory] = useState<FinishedGameHistory[]>([]);

  // Modals state
  const [isSelectPlayersModalOpen, setIsSelectPlayersModalOpen] = useState(false);
  const [slotPicker, setSlotPicker] = useState<{
    courtIndex: number;
    team: "teamA" | "teamB";
    slotIndex: number;
  } | null>(null);

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

  // Fetch match details
  const fetchMatchDetails = useCallback(async () => {
    if (!matchId) return;
    try {
      const res = await authFetch(`/api/matches/${matchId}`);
      if (!res.ok) {
        throw new Error("Match not found");
      }
      const data = await res.json();
      setMatch(data);

      const matchPlayers =
        data.players?.map(
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

      // Initialize session play counts
      const counts: Record<string, number> = {};
      matchPlayers.forEach((p: PlayerInMatch) => {
        counts[p.id] = p.playCount ?? 0;
      });
      setSessionPlayCounts(counts);

      // Load persisted round history
      const matchRounds = data.rounds ?? [];
      setGameHistory(
        matchRounds.map(
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
              (pid) =>
                matchPlayers.find((p: PlayerInMatch) => p.id === pid)?.name ||
                "Player"
            ),
            teamBNames: (round.teamBPlayerIds ?? []).map(
              (pid) =>
                matchPlayers.find((p: PlayerInMatch) => p.id === pid)?.name ||
                "Player"
            ),
            finishedAt: formatTimeHM(round.finishedAt),
          })
        )
      );

      // Initialize courts if not already configured
      const courtCount = parseInt(data.courtNumber || "4", 10) || 4;
      setCourts((prev) => {
        if (prev.length > 0) return prev;
        const initialCourts: CourtState[] = [];
        for (let i = 1; i <= Math.max(1, Math.min(courtCount, 8)); i++) {
          initialCourts.push({
            id: i,
            name: `Court ${i}`,
            status: "EMPTY",
            teamA: [{ playerId: null }, { playerId: null }],
            teamB: [{ playerId: null }, { playerId: null }],
          });
        }
        return initialCourts;
      });
    } catch (err) {
      console.error("Error fetching match details:", err);
      setErrorModal({
        isOpen: true,
        title: "Error",
        message: "Failed to load match details. Please return to the dashboard.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [matchId]);

  // Fetch all available players for the picker
  const fetchAllPlayers = useCallback(async () => {
    try {
      const res = await authFetch("/api/players");
      if (res.ok) {
        const data = await res.json();
        setAllAvailablePlayers(data);
      }
    } catch (err) {
      console.error("Failed to load players list:", err);
    }
  }, []);

  useEffect(() => {
    fetchMatchDetails();
    fetchAllPlayers();
  }, [fetchMatchDetails, fetchAllPlayers]);

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
    courts.forEach((court) => {
      court.teamA.forEach((slot) => slot.playerId && ids.add(slot.playerId));
      court.teamB.forEach((slot) => slot.playerId && ids.add(slot.playerId));
    });
    return ids;
  }, [courts]);

  // Unassigned players in queue
  const unassignedPlayers = useMemo(() => {
    return prioritizedPlayers.filter((p) => !assignedPlayerIds.has(p.id));
  }, [prioritizedPlayers, assignedPlayerIds]);

  // Handle slot assignment
  const handleAssignPlayerToSlot = (
    courtIndex: number,
    team: "teamA" | "teamB",
    slotIndex: number,
    playerId: string
  ) => {
    setCourts((prev) => {
      const next = [...prev];
      const court = { ...next[courtIndex] };
      const teamSlots = [...court[team]] as [CourtSlot, CourtSlot];
      teamSlots[slotIndex] = { playerId };
      court[team] = teamSlots;

      const hasAnyPlayer =
        court.teamA.some((s) => s.playerId) ||
        court.teamB.some((s) => s.playerId);
      court.status = hasAnyPlayer ? "IN PROGRESS" : "EMPTY";

      next[courtIndex] = court;
      return next;
    });

    setSlotPicker(null);
  };

  // Remove player from court slot
  const handleRemoveFromSlot = (
    courtIndex: number,
    team: "teamA" | "teamB",
    slotIndex: number
  ) => {
    setCourts((prev) => {
      const next = [...prev];
      const court = { ...next[courtIndex] };
      const teamSlots = [...court[team]] as [CourtSlot, CourtSlot];
      teamSlots[slotIndex] = { playerId: null };
      court[team] = teamSlots;

      const hasAnyPlayer =
        court.teamA.some((s) => s.playerId) ||
        court.teamB.some((s) => s.playerId);
      court.status = hasAnyPlayer ? "IN PROGRESS" : "EMPTY";

      next[courtIndex] = court;
      return next;
    });
  };

  // Auto assign players to empty slots based on priority
  const handleAutoAssign = () => {
    const available = [...unassignedPlayers];
    if (available.length === 0) {
      setErrorModal({
        isOpen: true,
        title: "No Available Players",
        message:
          "All joined players are already assigned to courts or no players in match.",
      });
      return;
    }

    setCourts((prev) => {
      const next = prev.map((c) => ({
        ...c,
        teamA: [{ ...c.teamA[0] }, { ...c.teamA[1] }] as [CourtSlot, CourtSlot],
        teamB: [{ ...c.teamB[0] }, { ...c.teamB[1] }] as [CourtSlot, CourtSlot],
      }));

      for (let i = 0; i < next.length; i++) {
        const court = next[i];
        // Team A
        for (let s = 0; s < 2; s++) {
          if (!court.teamA[s].playerId && available.length > 0) {
            const p = available.shift()!;
            court.teamA[s].playerId = p.id;
          }
        }
        // Team B
        for (let s = 0; s < 2; s++) {
          if (!court.teamB[s].playerId && available.length > 0) {
            const p = available.shift()!;
            court.teamB[s].playerId = p.id;
          }
        }

        const hasAny =
          court.teamA.some((s) => s.playerId) ||
          court.teamB.some((s) => s.playerId);
        court.status = hasAny ? "IN PROGRESS" : "EMPTY";
      }

      return next;
    });
  };

  // Reset all courts
  const handleResetAllCourts = () => {
    setCourts((prev) =>
      prev.map((c) => ({
        ...c,
        status: "EMPTY",
        teamA: [{ playerId: null }, { playerId: null }],
        teamB: [{ playerId: null }, { playerId: null }],
      }))
    );
  };

  // Finish Court game
  const handleFinishCourt = async (courtIndex: number) => {
    const court = courts[courtIndex];
    if (!court || !match) return;

    const teamAPlayerIds = court.teamA
      .map((s) => s.playerId)
      .filter(Boolean) as string[];
    const teamBPlayerIds = court.teamB
      .map((s) => s.playerId)
      .filter(Boolean) as string[];
    const allPlayedIds = [...teamAPlayerIds, ...teamBPlayerIds];

    if (allPlayedIds.length === 0) return;

    setIsSavingRound(true);
    try {
      const res = await authFetch(`/api/matches/${match.id}/rounds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courtNumber: court.id,
          teamAPlayerIds,
          teamBPlayerIds,
        }),
      });

      if (!res.ok) throw new Error("Failed to save round");
      const { round } = await res.json();

      // Increment session play count
      setSessionPlayCounts((prev) => {
        const next = { ...prev };
        allPlayedIds.forEach((id) => {
          next[id] = (next[id] || 0) + 1;
        });
        return next;
      });

      const teamANames = teamAPlayerIds
        .map((id) => players.find((p) => p.id === id)?.name || "Player")
        .filter(Boolean);
      const teamBNames = teamBPlayerIds
        .map((id) => players.find((p) => p.id === id)?.name || "Player")
        .filter(Boolean);

      const timeStr = formatTimeHM(new Date().toISOString());

      // Add to game history
      setGameHistory((prev) => [
        {
          id: round.id,
          courtName: court.name,
          teamANames,
          teamBNames,
          finishedAt: timeStr,
        },
        ...prev,
      ]);

      // Clear the finished court
      setCourts((prev) => {
        const next = [...prev];
        next[courtIndex] = {
          ...next[courtIndex],
          status: "EMPTY",
          teamA: [{ playerId: null }, { playerId: null }],
          teamB: [{ playerId: null }, { playerId: null }],
        };
        return next;
      });
    } catch (err) {
      console.error("Failed to save round:", err);
      setErrorModal({
        isOpen: true,
        title: "Save Failed",
        message: "Could not save this round. Please try again.",
      });
    } finally {
      setIsSavingRound(false);
    }
  };

  // Toggle Finish Match status
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

      const updated = await res.json();
      setMatch((prev) => (prev ? { ...prev, status: updated.status } : updated));

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
      await fetchMatchDetails();
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
          <Loader2 size={32} className="animate-spin text-emerald-400" />
        </div>
      </AppLayout>
    );
  }

  if (!match) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-semibold text-white">Match not found</p>
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

  return (
    <AppLayout>
      <div className="space-y-6 pb-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Link
            href="/matches"
            className="flex items-center gap-1 transition hover:text-white"
          >
            <ArrowLeft size={13} />
            <span>Matches</span>
          </Link>
          <ChevronRight size={13} className="text-gray-600" />
          <span className="truncate font-medium text-gray-300">
            {match.title}
          </span>
        </div>

        {/* Match Header Hero Card */}
        <div className="rounded-2xl border border-[#1a1e26] bg-[#0e1117] p-5 shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Title & Metadata */}
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {match.title}
                </h1>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${statusPillBg}`}
                >
                  {statusDisplay}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-emerald-400" />
                  {formatDate(match.date)}
                </span>
                <span className="text-gray-600">•</span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-blue-400" />
                  {formatTimeWithDuration(match.time)}
                </span>
                <span className="text-gray-600">•</span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-amber-400" />
                  {match.location || "Badminton Hall"}
                </span>
                <span className="text-gray-600">•</span>
                <span className="rounded-md bg-[#161a22] px-2 py-0.5 text-[11px] font-medium text-gray-300 border border-[#232834]">
                  {match.courtNumber || "4"} Courts
                </span>
                <span className="rounded-md bg-[#161a22] px-2 py-0.5 text-[11px] font-medium text-gray-300 border border-[#232834]">
                  {players.length} Players Joined
                </span>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {/* Manage Players Button */}
              <button
                type="button"
                onClick={() => setIsSelectPlayersModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-[#232834] bg-[#141820] px-3.5 py-2 text-xs font-semibold text-gray-200 transition hover:border-[#2d3444] hover:bg-[#1a202c] hover:text-white"
              >
                <Users size={14} />
                <span>Roster ({players.length})</span>
              </button>

              {/* Export Players Button */}
              <button
                type="button"
                onClick={() => exportPlayerList(match, players)}
                className="flex items-center gap-1.5 rounded-xl border border-[#232834] bg-[#141820] px-3.5 py-2 text-xs font-semibold text-gray-200 transition hover:border-[#2d3444] hover:bg-[#1a202c] hover:text-white"
                aria-label="Export Players"
              >
                <span>Export</span>
              </button>

              {/* Finish Match Button */}
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={handleToggleMatchStatus}
                aria-label={isMatchCompleted ? "Reopen Match" : "Finish Match"}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-md transition disabled:opacity-50 ${
                  isMatchCompleted
                    ? "border border-gray-700 bg-gray-800 hover:bg-gray-700"
                    : "border border-emerald-500/40 bg-emerald-600 hover:bg-emerald-500 text-white"
                }`}
              >
                {isUpdatingStatus ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : isMatchCompleted ? (
                  <RotateCcw size={14} />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                <span>
                  {isMatchCompleted ? "Reopen Match" : "Finish Match"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Unified 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Court Management & Courts Grid (8 Columns) */}
          <div className="space-y-4 lg:col-span-8">
            {/* Court Management Header Bar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-[#1a1e26] bg-[#0e1117] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Court Management</h2>
                <p className="text-xs text-gray-400">
                  Assign players to court slots (2v2). Lower play count is prioritized.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleAutoAssign}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
                >
                  <Sparkles size={13} />
                  <span>Auto Assign</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetAllCourts}
                  className="flex items-center gap-1.5 rounded-xl border border-[#232834] bg-[#141820] px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-[#1a202c] hover:text-white"
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Courts Grid — Unified 2-column layout */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {courts.map((court, courtIdx) => {
                const courtHasPlayers =
                  court.teamA.some((s) => s.playerId) ||
                  court.teamB.some((s) => s.playerId);
                const courtStatus = courtHasPlayers ? "IN PROGRESS" : "EMPTY";

                return (
                  <div
                    key={court.id}
                    className="flex flex-col justify-between rounded-2xl border border-[#1a1e26] bg-[#0e1117] p-4 transition-all hover:border-[#28303f] shadow-sm"
                  >
                    {/* Court Title & Status Header */}
                    <div className="mb-3.5 flex items-center justify-between border-b border-[#181d26] pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {court.name}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            courtStatus === "IN PROGRESS"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-[#141820] text-gray-400 border border-[#232834]"
                          }`}
                        >
                          {courtStatus}
                        </span>
                      </div>
                      <span className="rounded bg-[#141820] px-1.5 py-0.5 text-[10px] font-semibold text-gray-400">
                        2v2
                      </span>
                    </div>

                    {/* Team Slots */}
                    <div className="space-y-3">
                      {/* Team A */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                            Team A
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {court.teamA.map((slot, sIdx) => {
                            const playerObj = players.find(
                              (p) => p.id === slot.playerId
                            );
                            if (playerObj) {
                              const count =
                                sessionPlayCounts[playerObj.id] ??
                                playerObj.playCount ??
                                0;
                              return (
                                <div
                                  key={sIdx}
                                  className="flex items-center justify-between rounded-xl border border-[#232834] bg-[#12151c] px-2.5 py-1.5"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-gray-700">
                                      <Image
                                        src="/capybara-avatar.png"
                                        alt={playerObj.name}
                                        width={28}
                                        height={28}
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="truncate text-xs font-semibold text-white">
                                        {playerObj.name}
                                      </p>
                                      <p className="text-[10px] text-gray-400">
                                        {count}x played
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveFromSlot(
                                        courtIdx,
                                        "teamA",
                                        sIdx
                                      )
                                    }
                                    className="rounded p-1 text-gray-400 transition hover:bg-rose-500/10 hover:text-rose-400"
                                    title="Remove player"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              );
                            }

                            return (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() =>
                                  setSlotPicker({
                                    courtIndex: courtIdx,
                                    team: "teamA",
                                    slotIndex: sIdx,
                                  })
                                }
                                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#282d38] bg-[#12151c]/60 py-2 text-xs font-medium text-gray-400 transition hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:text-emerald-300"
                              >
                                <Plus size={13} />
                                <span>Add player</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* VS Divider */}
                      <div className="relative flex items-center justify-center py-0.5">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-[#1a1f28]" />
                        </div>
                        <span className="relative rounded-full bg-[#141820] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-400 border border-[#222734]">
                          VS
                        </span>
                      </div>

                      {/* Team B */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                            Team B
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {court.teamB.map((slot, sIdx) => {
                            const playerObj = players.find(
                              (p) => p.id === slot.playerId
                            );
                            if (playerObj) {
                              const count =
                                sessionPlayCounts[playerObj.id] ??
                                playerObj.playCount ??
                                0;
                              return (
                                <div
                                  key={sIdx}
                                  className="flex items-center justify-between rounded-xl border border-[#232834] bg-[#12151c] px-2.5 py-1.5"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-gray-700">
                                      <Image
                                        src="/capybara-avatar.png"
                                        alt={playerObj.name}
                                        width={28}
                                        height={28}
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="truncate text-xs font-semibold text-white">
                                        {playerObj.name}
                                      </p>
                                      <p className="text-[10px] text-gray-400">
                                        {count}x played
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveFromSlot(
                                        courtIdx,
                                        "teamB",
                                        sIdx
                                      )
                                    }
                                    className="rounded p-1 text-gray-400 transition hover:bg-rose-500/10 hover:text-rose-400"
                                    title="Remove player"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              );
                            }

                            return (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() =>
                                  setSlotPicker({
                                    courtIndex: courtIdx,
                                    team: "teamB",
                                    slotIndex: sIdx,
                                  })
                                }
                                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#282d38] bg-[#12151c]/60 py-2 text-xs font-medium text-gray-400 transition hover:border-blue-500/50 hover:bg-blue-500/5 hover:text-blue-300"
                              >
                                <Plus size={13} />
                                <span>Add player</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Finish Court Button */}
                    <div className="mt-4 pt-3 border-t border-[#181d26]">
                      <button
                        type="button"
                        disabled={!courtHasPlayers || isSavingRound}
                        onClick={() => handleFinishCourt(courtIdx)}
                        className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition shadow-sm ${
                          courtHasPlayers
                            ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                            : "border border-transparent bg-[#141820] text-gray-600 cursor-not-allowed"
                        }`}
                      >
                        <CheckCircle2 size={13} />
                        <span>Finish {court.name}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Player Priority & Match History (4 Columns) */}
          <div className="space-y-4 lg:col-span-4">
            {/* Player Priority Card */}
            <div className="rounded-2xl border border-[#1a1e26] bg-[#0e1117] p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Player Priority
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Fewer plays = higher priority
                  </p>
                </div>
                <span className="rounded-md border border-[#232834] bg-[#141820] px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  {unassignedPlayers.length} in queue
                </span>
              </div>

              {/* Priority list */}
              <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1 custom-scrollbar">
                {prioritizedPlayers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-500">
                    No players joined yet. Click below to add players.
                  </div>
                ) : (
                  prioritizedPlayers.map((player, idx) => {
                    const count =
                      sessionPlayCounts[player.id] ?? player.playCount ?? 0;
                    const isAssigned = assignedPlayerIds.has(player.id);

                    return (
                      <div
                        key={player.id}
                        className="flex items-center justify-between rounded-xl border border-[#1d222d] bg-[#12151c] px-3 py-2 transition hover:border-[#28303f]"
                      >
                        {/* Left: Avatar + Name */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-gray-700">
                            <Image
                              src="/capybara-avatar.png"
                              alt={player.name}
                              width={28}
                              height={28}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-white">
                              {player.name}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {count}x played {isAssigned && "• on court"}
                            </p>
                          </div>
                        </div>

                        {/* Right: Rank Crown / Number */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {idx === 0 && (
                            <Crown size={14} className="text-amber-400" />
                          )}
                          {idx === 1 && (
                            <Crown size={14} className="text-gray-300" />
                          )}
                          {idx === 2 && (
                            <Crown size={14} className="text-amber-600" />
                          )}
                          <span className="text-xs font-bold text-gray-400">
                            {idx + 1}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Manage Roster Button */}
              <button
                type="button"
                onClick={() => setIsSelectPlayersModalOpen(true)}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#232834] bg-[#141820] py-2 text-xs font-semibold text-gray-200 transition hover:bg-[#1a202c] hover:text-white"
              >
                <span>Manage Match Roster</span>
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Match History Card */}
            <div className="rounded-2xl border border-[#1a1e26] bg-[#0e1117] p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                  <History size={15} className="text-gray-400" />
                  <span>Match History</span>
                </h3>
                <span className="rounded-md border border-[#232834] bg-[#141820] px-2 py-0.5 text-[10px] font-medium text-gray-400">
                  {gameHistory.length} round
                  {gameHistory.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="max-h-64 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                {gameHistory.length === 0 ? (
                  <p className="py-6 text-center text-xs text-gray-500">
                    No rounds recorded for this match yet.
                  </p>
                ) : (
                  gameHistory.map((g) => (
                    <div
                      key={g.id}
                      className="rounded-xl border border-[#1d222d] bg-[#12151c] p-2.5 text-xs text-gray-300"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-semibold text-emerald-400">
                          {g.courtName}
                        </span>
                        <span className="text-[10px] font-medium text-gray-500">
                          {g.finishedAt}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400">
                        <span className="text-gray-200">
                          {g.teamANames.join(" & ")}
                        </span>{" "}
                        <span className="text-gray-500 font-bold">vs</span>{" "}
                        <span className="text-gray-200">
                          {g.teamBNames.join(" & ")}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slot Player Selector Dropdown / Modal */}
      {slotPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-[#232834] bg-[#0e1117] p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Select Player</h4>
                <p className="text-xs text-gray-400">
                  Choose from unassigned players in queue
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSlotPicker(null)}
                className="rounded-lg p-1 text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-64 space-y-1 overflow-y-auto pr-1 custom-scrollbar">
              {unassignedPlayers.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400">
                  <p>All joined players are currently assigned.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSlotPicker(null);
                      setIsSelectPlayersModalOpen(true);
                    }}
                    className="mt-2 text-emerald-400 underline hover:text-emerald-300 font-medium"
                  >
                    Add more players to roster
                  </button>
                </div>
              ) : (
                unassignedPlayers.map((player) => {
                  const count =
                    sessionPlayCounts[player.id] ?? player.playCount ?? 0;
                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() =>
                        handleAssignPlayerToSlot(
                          slotPicker.courtIndex,
                          slotPicker.team,
                          slotPicker.slotIndex,
                          player.id
                        )
                      }
                      className="flex w-full items-center justify-between rounded-xl border border-transparent bg-[#12151c] px-3 py-2 text-left transition hover:border-emerald-500/50 hover:bg-[#16202e]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-gray-700">
                          <Image
                            src="/capybara-avatar.png"
                            alt={player.name}
                            width={28}
                            height={28}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <span className="truncate text-xs font-semibold text-white">
                          {player.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-400">
                        {count}x played
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Select Players Modal (Roster Management) */}
      <SelectPlayersModal
        isOpen={isSelectPlayersModalOpen}
        onClose={() => setIsSelectPlayersModalOpen(false)}
        selectedPlayerIds={players.map((p) => p.id)}
        onSave={handleSaveRoster}
        availablePlayers={allAvailablePlayers}
        onPlayerCreated={(created) => {
          setAllAvailablePlayers((prev) => [...prev, created]);
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
