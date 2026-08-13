"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";
import type { PlayerInMatch } from "@/types/match-types";

export interface CourtSlot {
  playerId: string | null;
}

export interface CourtState {
  id: number;
  name: string;
  status: "IN PROGRESS" | "EMPTY" | "COMPLETED";
  teamA: [CourtSlot, CourtSlot];
  teamB: [CourtSlot, CourtSlot];
}

interface UseCourtManagerOptions {
  /** Match id used for the rounds POST endpoint. */
  matchId: string | null;
  /** Called with "no available players" when auto-assign finds an empty queue. */
  onAutoAssignEmpty?: () => void;
  /** Called when finishing a court round fails. */
  onFinishError?: () => void;
}

/**
 * Owns the interactive court state for the match details page: the grid of
 * 2v2 courts, the mobile court selector index, and the in-flight flag for
 * saving a round. Assignment/removal/auto-assign/reset are pure local state
 * mutations; finishing a court persists the round via the API and then
 * revalidates so play counts + history come back authoritative.
 */
export function useCourtManager({
  matchId,
  onAutoAssignEmpty,
  onFinishError,
}: UseCourtManagerOptions) {
  const [courts, setCourts] = useState<CourtState[]>([]);
  const [activeMobileCourtIndex, setActiveMobileCourtIndex] = useState(0);
  const [isSavingRound, setIsSavingRound] = useState(false);

  // Matches can switch while navigating between detail pages; the courts are
  // initialized once per match id so background revalidations never reset them.
  const initializedMatchIdRef = useRef<string | null>(null);
  const onAutoAssignEmptyRef = useRef(onAutoAssignEmpty);
  const onFinishErrorRef = useRef(onFinishError);
  const matchIdRef = useRef(matchId);

  useEffect(() => {
    onAutoAssignEmptyRef.current = onAutoAssignEmpty;
    onFinishErrorRef.current = onFinishError;
    matchIdRef.current = matchId;
  }, [onAutoAssignEmpty, onFinishError, matchId]);

  /** Initializes the grid only once per match id. */
  const ensureCourtsForMatch = useCallback(
    (matchDataId: string, courtNumber: string | null | undefined) => {
      if (initializedMatchIdRef.current === matchDataId) return;
      initializedMatchIdRef.current = matchDataId;
      const courtCount = parseInt(courtNumber || "4", 10) || 4;
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
      setCourts(initialCourts);
      setActiveMobileCourtIndex(0);
    },
    []
  );

  const handleAssignPlayerToSlot = useCallback(
    (courtIndex: number, team: "teamA" | "teamB", slotIndex: number, playerId: string) => {
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
    },
    []
  );

  const handleRemoveFromSlot = useCallback(
    (courtIndex: number, team: "teamA" | "teamB", slotIndex: number) => {
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
    },
    []
  );

  const handleAutoAssign = useCallback(
    (unassignedPlayers: PlayerInMatch[]) => {
      const available = [...unassignedPlayers];
      if (available.length === 0) {
        onAutoAssignEmptyRef.current?.();
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
          for (let s = 0; s < 2; s++) {
            if (!court.teamA[s].playerId && available.length > 0) {
              const p = available.shift()!;
              court.teamA[s].playerId = p.id;
            }
          }
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
    },
    []
  );

  const handleResetAllCourts = useCallback(() => {
    setCourts((prev) =>
      prev.map((c) => ({
        ...c,
        status: "EMPTY",
        teamA: [{ playerId: null }, { playerId: null }],
        teamB: [{ playerId: null }, { playerId: null }],
      }))
    );
  }, []);

  const handleFinishCourt = useCallback(
    async (courtIndex: number, revalidateMatch: () => Promise<unknown>) => {
      const court = courts[courtIndex];
      if (!court || !matchIdRef.current) return;

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
        const res = await authFetch(`/api/matches/${matchIdRef.current}/rounds`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courtNumber: court.id,
            teamAPlayerIds,
            teamBPlayerIds,
          }),
        });

        if (!res.ok) throw new Error("Failed to save round");

        // Revalidate so the incremented play counts + round history come back
        // from the server (authoritative, survives reloads).
        await revalidateMatch();

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
        onFinishErrorRef.current?.();
      } finally {
        setIsSavingRound(false);
      }
    },
    [courts]
  );

  return {
    courts,
    activeMobileCourtIndex,
    setActiveMobileCourtIndex,
    isSavingRound,
    ensureCourtsForMatch,
    handleAssignPlayerToSlot,
    handleRemoveFromSlot,
    handleAutoAssign,
    handleResetAllCourts,
    handleFinishCourt,
  };
}
