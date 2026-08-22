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

interface QueuePlayer {
  id: string;
}

const COURT_SIZE = 4;

function occupiedCount(court: CourtState): number {
  return [...court.teamA, ...court.teamB].filter((s) => s.playerId !== null)
    .length;
}

/** Fills up to `count` empty slots in slot order (teamA first). Returns how many were placed. */
function fillEmptySlots(
  court: CourtState,
  queue: QueuePlayer[],
  count: number
): number {
  const teams: [CourtSlot, CourtSlot][] = [court.teamA, court.teamB];
  let placed = 0;
  for (const team of teams) {
    for (let i = 0; i < team.length; i++) {
      if (placed >= count) return placed;
      if (team[i].playerId !== null) continue;
      const next = queue.shift();
      if (!next) return placed;
      team[i].playerId = next.id;
      placed += 1;
    }
  }
  return placed;
}

/**
 * Assigns the (already priority-sorted) queue of free players to the court
 * grid. Matches are 2v2, so a court is only ever filled to exactly 4:
 * in-progress courts (1-3 players, e.g. manually placed) are completed
 * first — most-full first — and empty courts are only opened when a full
 * 2v2 can be formed. Leftover players (always the highest play counts,
 * since the queue is consumed front-to-back) stay unassigned for the next
 * round. Returns a new grid; the input is not mutated.
 */
export function assignUnassignedPlayers(
  courts: CourtState[],
  queue: QueuePlayer[]
): CourtState[] {
  const available = [...queue];
  const next = courts.map((c): CourtState => ({
    ...c,
    teamA: [{ ...c.teamA[0] }, { ...c.teamA[1] }],
    teamB: [{ ...c.teamB[0] }, { ...c.teamB[1] }],
  }));

  // Pass 1: complete courts that already have players, most-full first so a
  // nearly-done court never stays at 3 while another court gets new players.
  const inProgress = next
    .map((court, index) => ({ court, index, occupied: occupiedCount(court) }))
    .filter(({ occupied }) => occupied > 0 && occupied < COURT_SIZE)
    .sort((a, b) => b.occupied - a.occupied);

  for (const { court } of inProgress) {
    const need = COURT_SIZE - occupiedCount(court);
    if (available.length >= need) {
      fillEmptySlots(court, available, need);
    }
  }

  // Pass 2: open empty courts only with a full 2v2.
  for (const court of next) {
    if (occupiedCount(court) !== 0) continue;
    if (available.length < COURT_SIZE) break;
    fillEmptySlots(court, available, COURT_SIZE);
  }

  for (const court of next) {
    court.status = occupiedCount(court) > 0 ? "IN PROGRESS" : "EMPTY";
  }

  return next;
}
