"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  History,
  Loader2,
  MoreVertical,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Timer,
  Trash2,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import NewMatchModal from "@/components/NewMatchModal";
import DeleteMatchModal from "@/components/DeleteMatchModal";
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

interface ActivityEvent {
  id: string;
  title: string;
  description: string;
  time: string;
  timestamp: number;
}

interface FinishedGameHistory {
  id: string;
  courtName: string;
  teamANames: string[];
  teamBNames: string[];
  finishedAt: string;
}

const IDR_FORMATTER = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

const formatCurrency = (amount: number) => IDR_FORMATTER.format(amount);

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const year = date.getFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
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
  const router = useRouter();
  const matchId = params?.id as string;

  // Match and player state
  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<PlayerInMatch[]>([]);
  const [allAvailablePlayers, setAllAvailablePlayers] = useState<PlayerOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Courts state
  const [courts, setCourts] = useState<CourtState[]>([]);
  const [activeMobileCourtIndex, setActiveMobileCourtIndex] = useState(0);

  // In-session player play counts
  const [sessionPlayCounts, setSessionPlayCounts] = useState<Record<string, number>>({});

  // Live timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Activity logs & History
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [gameHistory, setGameHistory] = useState<FinishedGameHistory[]>([]);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSelectPlayersModalOpen, setIsSelectPlayersModalOpen] = useState(false);
  const [slotPicker, setSlotPicker] = useState<{
    courtIndex: number;
    team: "teamA" | "teamB";
    slotIndex: number;
  } | null>(null);

  // Quick Action menu dropdown
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Edit notes state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

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

  // Close 3-dots menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      setNoteContent(data.description || "");

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

      // Initial activity
      setActivities((prev) => {
        if (prev.length > 0) return prev;
        return [
          {
            id: "act-init",
            title: "Match initialized",
            description: `Scheduled at ${data.location || data.title}`,
            time: "Start",
            timestamp: Date.now(),
          },
        ];
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

  // Elapsed timer logic
  useEffect(() => {
    if (!match) return;
    const isOngoing =
      match.status?.toUpperCase() === "IN PROGRESS" ||
      match.status?.toUpperCase() === "UPCOMING";
    if (!isOngoing) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [match]);

  const formattedElapsedTime = useMemo(() => {
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, [elapsedSeconds]);

  // Players prioritized by in-session play counts ascending (fewer plays = higher priority)
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
    const playerObj = players.find((p) => p.id === playerId);
    setCourts((prev) => {
      const next = [...prev];
      const court = { ...next[courtIndex] };
      const teamSlots = [...court[team]] as [CourtSlot, CourtSlot];
      teamSlots[slotIndex] = { playerId };
      court[team] = teamSlots;

      // Update court status
      const hasAnyPlayer =
        court.teamA.some((s) => s.playerId) || court.teamB.some((s) => s.playerId);
      court.status = hasAnyPlayer ? "IN PROGRESS" : "EMPTY";

      next[courtIndex] = court;
      return next;
    });

    if (playerObj) {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      setActivities((prev) => [
        {
          id: `act-${Date.now()}`,
          title: `Court ${courtIndex + 1} updated`,
          description: `${playerObj.name} assigned to ${team === "teamA" ? "Team A" : "Team B"}`,
          time: timeStr,
          timestamp: Date.now(),
        },
        ...prev,
      ]);
    }

    setSlotPicker(null);
  };

  // Remove player from court slot
  const handleRemoveFromSlot = (
    courtIndex: number,
    team: "teamA" | "teamB",
    slotIndex: number
  ) => {
    const currentSlot = courts[courtIndex]?.[team]?.[slotIndex];
    const removedPlayer = players.find((p) => p.id === currentSlot?.playerId);

    setCourts((prev) => {
      const next = [...prev];
      const court = { ...next[courtIndex] };
      const teamSlots = [...court[team]] as [CourtSlot, CourtSlot];
      teamSlots[slotIndex] = { playerId: null };
      court[team] = teamSlots;

      const hasAnyPlayer =
        court.teamA.some((s) => s.playerId) || court.teamB.some((s) => s.playerId);
      court.status = hasAnyPlayer ? "IN PROGRESS" : "EMPTY";

      next[courtIndex] = court;
      return next;
    });

    if (removedPlayer) {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      setActivities((prev) => [
        {
          id: `act-${Date.now()}`,
          title: `Court ${courtIndex + 1} updated`,
          description: `${removedPlayer.name} removed`,
          time: timeStr,
          timestamp: Date.now(),
        },
        ...prev,
      ]);
    }
  };

  // Auto assign players to empty slots based on priority
  const handleAutoAssign = () => {
    const available = [...unassignedPlayers];
    if (available.length === 0) {
      setErrorModal({
        isOpen: true,
        title: "No Available Players",
        message: "All joined players are already assigned to courts or no players in match.",
      });
      return;
    }

    let assignedCount = 0;
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
            assignedCount++;
          }
        }
        // Team B
        for (let s = 0; s < 2; s++) {
          if (!court.teamB[s].playerId && available.length > 0) {
            const p = available.shift()!;
            court.teamB[s].playerId = p.id;
            assignedCount++;
          }
        }

        const hasAny =
          court.teamA.some((s) => s.playerId) || court.teamB.some((s) => s.playerId);
        court.status = hasAny ? "IN PROGRESS" : "EMPTY";
      }

      return next;
    });

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        title: "Auto-assigned courts",
        description: `Filled ${assignedCount} player slot${assignedCount === 1 ? "" : "s"} based on priority queue`,
        time: timeStr,
        timestamp: Date.now(),
      },
      ...prev,
    ]);
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

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        title: "Courts reset",
        description: "All courts cleared and players returned to queue",
        time: timeStr,
        timestamp: Date.now(),
      },
      ...prev,
    ]);
  };

  // Finish Court game
  const handleFinishCourt = (courtIndex: number) => {
    const court = courts[courtIndex];
    if (!court) return;

    const teamAPlayerIds = court.teamA.map((s) => s.playerId).filter(Boolean) as string[];
    const teamBPlayerIds = court.teamB.map((s) => s.playerId).filter(Boolean) as string[];
    const allPlayedIds = [...teamAPlayerIds, ...teamBPlayerIds];

    if (allPlayedIds.length === 0) return;

    // Increment session play count for players on this court
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

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    // Add to game history
    setGameHistory((prev) => [
      {
        id: `hist-${Date.now()}`,
        courtName: court.name,
        teamANames,
        teamBNames,
        finishedAt: timeStr,
      },
      ...prev,
    ]);

    // Add to activity
    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        title: `${court.name} game finished`,
        description: `${teamANames.join(", ")} vs ${teamBNames.join(", ")}`,
        time: timeStr,
        timestamp: Date.now(),
      },
      ...prev,
    ]);

    // Clear the finished court for next rotation
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

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      setActivities((prev) => [
        {
          id: `act-${Date.now()}`,
          title: nextStatus === "COMPLETED" ? "Match marked Completed" : "Match reopened",
          description: `Status updated by admin`,
          time: timeStr,
          timestamp: Date.now(),
        },
        ...prev,
      ]);

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

  // Save notes
  const handleSaveNotes = async () => {
    if (!match) return;
    setIsSavingNotes(true);
    try {
      const res = await authFetch(`/api/matches/${match.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: noteContent.trim() }),
      });
      if (res.ok) {
        setMatch((prev) => (prev ? { ...prev, description: noteContent.trim() } : prev));
        setIsEditingNotes(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingNotes(false);
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

  // Delete match
  const handleConfirmDelete = async () => {
    if (!match) return;
    setIsDeleting(true);
    try {
      const res = await authFetch(`/api/matches/${match.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/");
    } catch (err) {
      console.error(err);
      setErrorModal({
        isOpen: true,
        title: "Delete Failed",
        message: "Failed to delete this match.",
      });
    } finally {
      setIsDeleting(false);
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
            href="/"
            className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
          >
            Back to Dashboard
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
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Link href="/" className="transition hover:text-white">
            Matches
          </Link>
          <ChevronRight size={13} />
          <span className="truncate font-medium text-gray-300">
            {match.title} - {formatDate(match.date)}
          </span>
        </div>

        {/* Match Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5 min-w-0">
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
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <Calendar size={13} className="text-gray-400" />
                {formatDate(match.date)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-gray-400" />
                {formatTimeWithDuration(match.time)}
              </span>
              <span>•</span>
              <span>
                {match.courtNumber || "4"} Courts • {players.length} Players
              </span>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
            {/* 3-dots Menu */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#232730] bg-[#12151c] text-gray-300 transition hover:bg-[#1a1f29] hover:text-white"
                title="More actions"
              >
                <MoreVertical size={16} />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 top-11 z-30 w-48 rounded-xl border border-[#232730] bg-[#0c0e12] p-1 shadow-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsEditModalOpen(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-300 transition hover:bg-[#161a22] hover:text-white"
                  >
                    <Pencil size={13} />
                    <span>Edit Match</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      exportPlayerList(match, players);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-300 transition hover:bg-[#161a22] hover:text-white"
                  >
                    <Users size={13} />
                    <span>Export Players</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleResetAllCourts();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-300 transition hover:bg-[#161a22] hover:text-white"
                  >
                    <RotateCcw size={13} />
                    <span>Reset All Courts</span>
                  </button>
                  <div className="my-1 border-t border-[#1e222b]" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsDeleteModalOpen(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 size={13} />
                    <span>Delete Match</span>
                  </button>
                </div>
              )}
            </div>

            {/* Edit Match Button */}
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-[#232730] bg-[#12151c] px-3.5 py-2 text-xs font-medium text-gray-200 transition hover:bg-[#1a1f29] hover:text-white"
              aria-label="Edit Match"
            >
              <Pencil size={13} />
              <span className="hidden sm:inline">Edit Match</span>
            </button>

            {/* Finish Match Button */}
            <button
              type="button"
              disabled={isUpdatingStatus}
              onClick={handleToggleMatchStatus}
              aria-label={isMatchCompleted ? "Reopen Match" : "Finish Match"}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium text-white shadow-sm transition disabled:opacity-50 ${
                isMatchCompleted
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-blue-600 hover:bg-blue-500"
              }`}
            >
              {isUpdatingStatus ? (
                <Loader2 size={14} className="animate-spin" />
              ) : isMatchCompleted ? (
                <RotateCcw size={14} />
              ) : (
                <CheckCircle2 size={14} />
              )}
              <span className="hidden sm:inline">{isMatchCompleted ? "Reopen Match" : "Finish Match"}</span>
            </button>
          </div>
        </div>

        {/* Top 5 Info Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {/* 1. Court Fee */}
          <div className="flex items-center gap-3 rounded-2xl border border-[#1a1f28] bg-[#0c0e12] p-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Wallet size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-gray-400">Court Fee</p>
              <p className="truncate text-sm font-bold text-white">
                {formatCurrency(match.fee)}
              </p>
            </div>
          </div>

          {/* 2. Status */}
          <div className="flex items-center gap-3 rounded-2xl border border-[#1a1f28] bg-[#0c0e12] p-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Play size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-gray-400">Status</p>
              <p className="truncate text-sm font-bold text-white">{statusDisplay}</p>
            </div>
          </div>

          {/* 3. Created By */}
          <div className="flex items-center gap-3 rounded-2xl border border-[#1a1f28] bg-[#0c0e12] p-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <User size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-gray-400">Created By</p>
              <p className="truncate text-sm font-bold text-white">Capybara</p>
              <p className="text-[10px] text-gray-500">{formatDate(match.createdAt)}</p>
            </div>
          </div>

          {/* 4. Started At */}
          <div className="flex items-center gap-3 rounded-2xl border border-[#1a1f28] bg-[#0c0e12] p-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Clock size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-gray-400">Started At</p>
              <p className="truncate text-sm font-bold text-white">
                {match.time?.split("-")[0]?.trim() || "18:00"}
              </p>
              <p className="text-[10px] text-gray-500">{formatDate(match.date)}</p>
            </div>
          </div>

          {/* 5. Elapsed Time */}
          <div className="col-span-2 sm:col-span-1 flex items-center gap-3 rounded-2xl border border-[#1a1f28] bg-[#0c0e12] p-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Timer size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-gray-400">Elapsed Time</p>
              <p className="truncate text-sm font-mono font-bold text-white">
                {formattedElapsedTime}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid: Courts Management (Left) + Priority/Activity (Right) */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* Left Column: Court Management */}
          <div className="space-y-4 xl:col-span-8">
            {/* Court Management Header */}
            <div className="flex flex-col gap-3 rounded-2xl border border-[#1a1f28] bg-[#0c0e12] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Court Management</h2>
                <p className="text-xs text-gray-400">
                  Assign players to courts. Players will be prioritized based on play count (lower is prioritized).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={handleAutoAssign}
                  className="flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/20"
                >
                  <Sparkles size={13} />
                  <span>Auto Assign Players</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetAllCourts}
                  className="flex items-center gap-1.5 rounded-xl border border-[#232730] bg-[#12151c] px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-[#1a1f29] hover:text-white"
                >
                  <RotateCcw size={13} />
                  <span>Reset All Courts</span>
                </button>
              </div>
            </div>

            {/* Mobile Court Selector Tabs */}
            <div className="flex overflow-x-auto gap-1 rounded-xl bg-[#0c0e12] p-1 border border-[#1a1f28] xl:hidden">
              {courts.map((c, idx) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveMobileCourtIndex(idx)}
                  className={`flex-1 min-w-[80px] rounded-lg py-1.5 text-xs font-medium transition ${
                    activeMobileCourtIndex === idx
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Courts Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
              {courts.map((court, courtIdx) => {
                // Show only the active court below xl (mobile tabs drive it);
                // CSS classes handle the breakpoint — no window reads in render.
                const isActiveCourt = activeMobileCourtIndex === courtIdx;

                const courtHasPlayers =
                  court.teamA.some((s) => s.playerId) || court.teamB.some((s) => s.playerId);
                const courtStatus = courtHasPlayers ? "IN PROGRESS" : "EMPTY";

                return (
                  <div
                    key={court.id}
                    className={`flex-col justify-between rounded-2xl border border-[#1a1f28] bg-[#0c0e12] p-4 transition-all hover:border-[#28303f] ${
                      isActiveCourt ? "flex" : "hidden xl:flex"
                    }`}
                  >
                    {/* Court Title & Status */}
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{court.name}</span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            courtStatus === "IN PROGRESS"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-gray-800 text-gray-400"
                          }`}
                        >
                          {courtStatus}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-gray-500">2v2</span>
                    </div>

                    {/* Teams Slots */}
                    <div className="space-y-3">
                      {/* Team A */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                          Team A
                        </span>
                        <div className="space-y-1.5">
                          {court.teamA.map((slot, sIdx) => {
                            const playerObj = players.find((p) => p.id === slot.playerId);
                            if (playerObj) {
                              const count = sessionPlayCounts[playerObj.id] ?? playerObj.playCount ?? 0;
                              return (
                                <div
                                  key={sIdx}
                                  className="flex items-center justify-between rounded-xl border border-[#232730] bg-[#12151c] px-2.5 py-1.5"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Image
                                      src="/capybara-avatar.png"
                                      alt={playerObj.name}
                                      width={400}
                                      height={383}
                                      className="h-7 w-7 shrink-0 rounded-full object-cover border border-gray-700"
                                    />
                                    <div className="min-w-0">
                                      <p className="truncate text-xs font-semibold text-white">
                                        {playerObj.name}
                                      </p>
                                      <p className="text-[10px] text-gray-400">{count}x played</p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFromSlot(courtIdx, "teamA", sIdx)}
                                    className="rounded p-1 text-gray-500 transition hover:bg-gray-800 hover:text-red-400"
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
                                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#232730] bg-[#0e1117]/60 py-2 text-xs font-medium text-gray-400 transition hover:border-blue-500/60 hover:bg-blue-500/5 hover:text-blue-400"
                              >
                                <Plus size={13} />
                                <span>Add player</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* VS Separator */}
                      <div className="relative flex items-center justify-center py-1">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-[#1a1f28]" />
                        </div>
                        <span className="relative bg-[#0c0e12] px-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                          VS
                        </span>
                      </div>

                      {/* Team B */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
                          Team B
                        </span>
                        <div className="space-y-1.5">
                          {court.teamB.map((slot, sIdx) => {
                            const playerObj = players.find((p) => p.id === slot.playerId);
                            if (playerObj) {
                              const count = sessionPlayCounts[playerObj.id] ?? playerObj.playCount ?? 0;
                              return (
                                <div
                                  key={sIdx}
                                  className="flex items-center justify-between rounded-xl border border-[#232730] bg-[#12151c] px-2.5 py-1.5"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Image
                                      src="/capybara-avatar.png"
                                      alt={playerObj.name}
                                      width={400}
                                      height={383}
                                      className="h-7 w-7 shrink-0 rounded-full object-cover border border-gray-700"
                                    />
                                    <div className="min-w-0">
                                      <p className="truncate text-xs font-semibold text-white">
                                        {playerObj.name}
                                      </p>
                                      <p className="text-[10px] text-gray-400">{count}x played</p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFromSlot(courtIdx, "teamB", sIdx)}
                                    className="rounded p-1 text-gray-500 transition hover:bg-gray-800 hover:text-red-400"
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
                                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#232730] bg-[#0e1117]/60 py-2 text-xs font-medium text-gray-400 transition hover:border-blue-500/60 hover:bg-blue-500/5 hover:text-blue-400"
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
                    <div className="mt-4 pt-3 border-t border-[#1a1f28]">
                      <button
                        type="button"
                        disabled={!courtHasPlayers}
                        onClick={() => handleFinishCourt(courtIdx)}
                        className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition ${
                          courtHasPlayers
                            ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                            : "border border-transparent bg-[#12151c] text-gray-600 cursor-not-allowed"
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

          {/* Right Column: Player Priority & Activity Feed */}
          <div className="space-y-4 xl:col-span-4">
            {/* Player Priority Card */}
            <div className="rounded-2xl border border-[#1a1f28] bg-[#0c0e12] p-4">
              <div className="mb-3">
                <h3 className="text-sm font-bold text-white">Player Priority (by play count)</h3>
                <p className="text-xs text-gray-400">Players with fewer plays are prioritized.</p>
              </div>

              {/* Priority list */}
              <div className="max-h-[340px] space-y-1.5 overflow-y-auto pr-1">
                {prioritizedPlayers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-500">
                    No players joined yet. Click below to add players.
                  </div>
                ) : (
                  prioritizedPlayers.map((player, idx) => {
                    const count = sessionPlayCounts[player.id] ?? player.playCount ?? 0;
                    const isAssigned = assignedPlayerIds.has(player.id);

                    return (
                      <div
                        key={player.id}
                        className="flex items-center justify-between rounded-xl border border-transparent bg-[#12151c] px-3 py-2 transition hover:border-[#232730]"
                      >
                        {/* Left: Avatar + Name */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Image
                            src="/capybara-avatar.png"
                            alt={player.name}
                            width={400}
                            height={383}
                            className="h-7 w-7 shrink-0 rounded-full object-cover border border-gray-700"
                          />
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
                          {idx === 0 && <Crown size={14} className="text-amber-400" />}
                          {idx === 1 && <Crown size={14} className="text-gray-300" />}
                          {idx === 2 && <Crown size={14} className="text-amber-600" />}
                          <span className="text-xs font-bold text-gray-400">{idx + 1}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* View All Players button */}
              <button
                type="button"
                onClick={() => setIsSelectPlayersModalOpen(true)}
                className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#232730] bg-[#12151c] py-2 text-xs font-medium text-gray-300 transition hover:bg-[#1a1f29] hover:text-white"
              >
                <span>View All Players</span>
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Activity Feed Card */}
            <div className="rounded-2xl border border-[#1a1f28] bg-[#0c0e12] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Activity</h3>
                <span className="text-[11px] font-medium text-gray-500">Live</span>
              </div>

              <div className="max-h-[240px] space-y-2.5 overflow-y-auto pr-1">
                {activities.length === 0 ? (
                  <p className="py-6 text-center text-xs text-gray-500">No activity yet.</p>
                ) : (
                  activities.slice(0, 10).map((act) => (
                    <div
                      key={act.id}
                      className="flex items-start justify-between gap-2 border-b border-[#181d26] pb-2 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white">{act.title}</p>
                        <p className="truncate text-[11px] text-gray-400">{act.description}</p>
                      </div>
                      <span className="shrink-0 text-[10px] text-gray-500">{act.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Summary Cards: Selected Players (Left) + Match Notes (Middle) + Match History (Right) */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* 1. Selected Players Stack */}
          <div
            onClick={() => setIsSelectPlayersModalOpen(true)}
            className="flex cursor-pointer flex-col justify-between rounded-2xl border border-[#1a1f28] bg-[#0c0e12] p-4 transition hover:border-[#28303f]"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">
                Selected Players ({players.length})
              </h3>
              <ChevronRight size={14} className="text-gray-500" />
            </div>

            <div className="flex items-center -space-x-2 overflow-hidden py-1">
              {players.slice(0, 8).map((p) => {
                return (
                  <Image
                    key={p.id}
                    src="/capybara-avatar.png"
                    alt={p.name}
                    title={p.name}
                    width={400}
                    height={383}
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-[#0c0e12] shadow"
                  />
                );
              })}
              {players.length > 8 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-[10px] font-bold text-gray-300 ring-2 ring-[#0c0e12]">
                  +{players.length - 8}
                </div>
              )}
            </div>
            <p className="mt-2 text-[11px] text-gray-500">Tap to manage match roster</p>
          </div>

          {/* 2. Match Notes */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#1a1f28] bg-[#0c0e12] p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">Match Notes</h3>
              <button
                type="button"
                onClick={() => setIsEditingNotes(!isEditingNotes)}
                className="rounded p-1 text-gray-400 hover:text-white"
                title="Edit notes"
              >
                <Pencil size={13} />
              </button>
            </div>

            {isEditingNotes ? (
              <div className="space-y-2">
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Add notes for this match..."
                  rows={2}
                  className="w-full rounded-xl border border-[#232730] bg-[#12151c] p-2 text-xs text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsEditingNotes(false)}
                    className="rounded-lg px-2.5 py-1 text-xs text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSavingNotes}
                    onClick={handleSaveNotes}
                    className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500"
                  >
                    {isSavingNotes ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-300 line-clamp-3">
                {match.description?.trim() || "No notes for this match yet."}
              </p>
            )}
            <p className="mt-2 text-[11px] text-gray-500">Visible to administrators</p>
          </div>

          {/* 3. Match History */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#1a1f28] bg-[#0c0e12] p-4">
            <div className="flex items-center gap-2 mb-2">
              <History size={15} className="text-gray-400" />
              <h3 className="text-sm font-bold text-white">Match History</h3>
            </div>

            <div className="max-h-[100px] space-y-1.5 overflow-y-auto">
              {gameHistory.length === 0 ? (
                <p className="py-2 text-xs text-gray-500">No history for this match yet.</p>
              ) : (
                gameHistory.map((g) => (
                  <div key={g.id} className="text-[11px] text-gray-300">
                    <span className="font-semibold text-emerald-400">{g.courtName}:</span>{" "}
                    {g.teamANames.join(" & ")} vs {g.teamBNames.join(" & ")} ({g.finishedAt})
                  </div>
                ))
              )}
            </div>
            <p className="mt-2 text-[11px] text-gray-500">
              {gameHistory.length} round{gameHistory.length === 1 ? "" : "s"} completed
            </p>
          </div>
        </div>
      </div>

      {/* Slot Player Selector Dropdown / Modal */}
      {slotPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#232730] bg-[#0c0e12] p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Select Player</h4>
                <p className="text-xs text-gray-400">
                  Choose from available unassigned players
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

            <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
              {unassignedPlayers.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400">
                  <p>All joined players are currently assigned.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSlotPicker(null);
                      setIsSelectPlayersModalOpen(true);
                    }}
                    className="mt-2 text-blue-400 underline hover:text-blue-300"
                  >
                    Add more players to match
                  </button>
                </div>
              ) : (
                unassignedPlayers.map((player) => {
                  const count = sessionPlayCounts[player.id] ?? player.playCount ?? 0;
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
                      className="flex w-full items-center justify-between rounded-xl border border-transparent bg-[#12151c] px-3 py-2 text-left transition hover:border-blue-500/50 hover:bg-[#161f30]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Image
                          src="/capybara-avatar.png"
                          alt={player.name}
                          width={400}
                          height={383}
                          className="h-7 w-7 shrink-0 rounded-full object-cover border border-gray-700"
                        />
                        <span className="truncate text-xs font-semibold text-white">
                          {player.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-emerald-400">
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

      {/* Edit Match Modal */}
      {isEditModalOpen && (
        <NewMatchModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          editingMatch={match}
          onSubmit={async (matchData) => {
            try {
              const res = await authFetch(`/api/matches/${match.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(matchData),
              });
              if (res.ok) {
                await fetchMatchDetails();
                setIsEditModalOpen(false);
                setSuccessModal({
                  isOpen: true,
                  title: "Success",
                  message: "Match details updated successfully.",
                });
              }
            } catch (err) {
              console.error(err);
            }
          }}
        />
      )}

      {/* Delete Match Modal */}
      <DeleteMatchModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        matchTitle={match.title}
        isLoading={isDeleting}
      />

      {/* Feedback Modals */}
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ isOpen: false, title: "", message: "" })}
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
