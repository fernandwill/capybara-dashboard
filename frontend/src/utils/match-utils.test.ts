import { describe, it, expect } from "vitest";
import {
    parseDate,
    sortMatches,
    getClosestUpcomingMatch,
} from './match-utils';
import { Match } from "@/types/types";

// Helper to create a mock match
function createMockMatch(overrides: Partial<Match> = {}): Match {
    return {
        id: "1",
        title: "Test Match",
        location: "Test Location",
        courtNumber: "1",
        date: "2025-01-15",
        time: "18:00-20:00",
        fee: 50000,
        status: "UPCOMING",
        createdAt: "2025-01-01",
        players: [],
        ...overrides,
    };
}

describe("parseDate", () => {
    it("parses a valid date string and returns timestamp", () => {
        const result = parseDate("2025-01-15");
        expect(result).toBeGreaterThan(0);
    });

    it("returns 0 for invalid date strings", () => {
        expect(parseDate("not-a-date")).toBe(0);
        expect(parseDate("")).toBe(0);
    });
});

describe("sortMatches", () => {
    const matchA = createMockMatch({ id: "a", date: "2025-01-15", time: "18:00-20:00", fee: 50000 });
    const matchB = createMockMatch({ id: "b", date: "2025-01-20", time: "18:00-20:00", fee: 75000 });
    const matchC = createMockMatch({ id: "c", date: "2025-01-15", time: "20:00-22:00", fee: 25000 });

    it("sorts by date earliest first", () => {
        const result = sortMatches([matchB, matchA, matchC], "date-earliest");
        expect(result[0].id).toBe("a");
        expect(result[1].id).toBe("c");
        expect(result[2].id).toBe("b");
    });

    it("sorts by date latest first", () => {
        const result = sortMatches([matchA, matchB, matchC], "date-latest");
        expect(result[0].id).toBe("b");
    });

    it("sorts by fee low to high", () => {
        const result = sortMatches([matchA, matchB, matchC], "fee-low");
        expect(result[0].id).toBe("c");
        expect(result[1].id).toBe("a");
        expect(result[2].id).toBe("b");
    });

    it("sorts by fee high to low", () => {
        const result = sortMatches([matchA, matchB, matchC], "fee-high");
        expect(result[0].id).toBe("b");
        expect(result[1].id).toBe("a");
        expect(result[2].id).toBe("c");
    });
});

describe("getClosestUpcomingMatch", () => {
    it("returns null for empty array", () => {
        expect(getClosestUpcomingMatch([])).toBeNull();
    });

    it("returns null if no upcoming matches", () => {
        const completedMatch = createMockMatch({ status: "COMPLETED" });
        expect(getClosestUpcomingMatch([completedMatch])).toBeNull();
    });

    it("returns the closest upcoming match by date", () => {
        const match1 = createMockMatch({ id: "1", date: "2025-01-20", status: "UPCOMING" });
        const match2 = createMockMatch({ id: "2", date: "2025-01-15", status: "UPCOMING" });
        const match3 = createMockMatch({ id: "3", date: "2025-01-25", status: "UPCOMING" });

        const result = getClosestUpcomingMatch([match1, match2, match3]);
        expect(result?.id).toBe("2");
    });

    it("considers time when dates are the same", () => {
        const match1 = createMockMatch({ id: "1", date: "2025-01-15", time: "20:00-22:00", status: "UPCOMING" });
        const match2 = createMockMatch({ id: "2", date: "2025-01-15", time: "18:00-20:00", status: "UPCOMING" });

        const result = getClosestUpcomingMatch([match1, match2]);
        expect(result?.id).toBe("2");
    });
});
