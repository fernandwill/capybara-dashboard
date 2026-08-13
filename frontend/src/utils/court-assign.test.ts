import { describe, expect, it } from "vitest";
import { assignUnassignedPlayers, type CourtState } from "./court-assign";

function makeCourts(count: number): CourtState[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Court ${i + 1}`,
    status: "EMPTY",
    teamA: [{ playerId: null }, { playerId: null }],
    teamB: [{ playerId: null }, { playerId: null }],
  }));
}

const players = (ids: string[]) => ids.map((id) => ({ id }));

const playerIdsOn = (court: CourtState): string[] =>
  [...court.teamA, ...court.teamB]
    .map((s) => s.playerId)
    .filter((id): id is string => id !== null);

describe("assignUnassignedPlayers", () => {
  it("never starts a court with fewer than 4 players", () => {
    const result = assignUnassignedPlayers(
      makeCourts(2),
      players(["a", "b", "c"])
    );
    expect(playerIdsOn(result[0])).toEqual([]);
    expect(playerIdsOn(result[1])).toEqual([]);
  });

  it("fills exactly 4 players into an empty court", () => {
    const result = assignUnassignedPlayers(
      makeCourts(2),
      players(["a", "b", "c", "d"])
    );
    expect(playerIdsOn(result[0]).sort()).toEqual(["a", "b", "c", "d"]);
    expect(playerIdsOn(result[1])).toEqual([]);
  });

  it("leaves the odd remainder unassigned (7 players -> 1 full court)", () => {
    const result = assignUnassignedPlayers(
      makeCourts(2),
      players(["a", "b", "c", "d", "e", "f", "g"])
    );
    expect(playerIdsOn(result[0]).length).toBe(4);
    expect(playerIdsOn(result[1])).toEqual([]);
  });

  it("consumes the queue in order so lowest play count goes first", () => {
    const result = assignUnassignedPlayers(
      makeCourts(2),
      players(["low1", "low2", "low3", "low4", "high1", "high2", "high3"])
    );
    expect(playerIdsOn(result[0])).toEqual(["low1", "low2", "low3", "low4"]);
  });

  it("completes an in-progress court before opening a new one", () => {
    const courts = makeCourts(2);
    courts[0].teamA[0].playerId = "existing1";
    courts[0].teamB[0].playerId = "existing2";
    courts[0].status = "IN PROGRESS";

    const result = assignUnassignedPlayers(courts, players(["x", "y"]));
    expect(playerIdsOn(result[0]).sort()).toEqual(
      ["existing1", "existing2", "x", "y"].sort()
    );
    expect(playerIdsOn(result[1])).toEqual([]);
  });

  it("completes the most-full court first when the queue can't fill everything", () => {
    const courts = makeCourts(2);
    courts[0].teamA[0].playerId = "a";
    courts[0].teamB[0].playerId = "b";
    courts[0].teamB[1].playerId = "c";
    courts[0].status = "IN PROGRESS";
    courts[1].teamA[0].playerId = "x";
    courts[1].status = "IN PROGRESS";

    // court0 needs 1, court1 needs 3, only 3 free -> complete court0
    const result = assignUnassignedPlayers(courts, players(["d", "e", "f"]));
    expect(playerIdsOn(result[0]).length).toBe(4);
    expect(playerIdsOn(result[1]).length).toBe(1);
  });
});
