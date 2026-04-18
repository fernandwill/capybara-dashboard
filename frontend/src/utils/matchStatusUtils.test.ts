import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { findMany, updateMany, warn, info, error } = vi.hoisted(() => ({
    findMany: vi.fn(),
    updateMany: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
}));

vi.mock("@/lib/database", () => ({
    default: {
        match: {
            findMany,
            updateMany,
        },
    },
}));

vi.mock("@/lib/logger", () => ({
    logger: {
        debug: vi.fn(),
        info,
        warn,
        error,
    },
}));

import { getMatchIdsToComplete, updateMatchStatuses } from "./matchStatusUtils";

describe("getMatchIdsToComplete", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        // 2026-04-13 21:00:00 WIB
        vi.setSystemTime(new Date("2026-04-13T21:00:00+07:00"));
        warn.mockReset();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("returns only IDs whose end time has passed", () => {
        // Prisma stores dates as UTC (start of day)
        const today = new Date("2026-04-13T00:00:00Z");

        const result = getMatchIdsToComplete([
            { id: "past", date: today, time: "18:00-20:00" },
            { id: "future", date: today, time: "22:00-23:00" },
            { id: "invalid", date: today, time: "invalid" },
        ]);

        expect(result).toEqual(["past"]);
        expect(warn).toHaveBeenCalledWith("Invalid time format for match invalid: invalid");
    });
});

describe("updateMatchStatuses", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        // 2026-04-13 21:00:00 WIB
        vi.setSystemTime(new Date("2026-04-13T21:00:00+07:00"));
        findMany.mockReset();
        updateMany.mockReset();
        info.mockReset();
        error.mockReset();
        warn.mockReset();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("updates eligible matches in a single batch", async () => {
        const now = new Date("2026-04-13T21:00:00+07:00");
        const today = new Date("2026-04-13T00:00:00Z");

        findMany.mockResolvedValue([
            { id: "past", date: today, time: "18:00-20:00" },
            { id: "future", date: today, time: "22:00-23:00" },
        ]);
        updateMany.mockResolvedValue({ count: 1 });

        const updatedCount = await updateMatchStatuses();

        expect(findMany).toHaveBeenCalledWith({
            where: {
                status: "UPCOMING",
                date: {
                    lte: now,
                },
            },
            select: {
                id: true,
                date: true,
                time: true,
            },
        });
        expect(updateMany).toHaveBeenCalledWith({
            where: {
                id: {
                    in: ["past"],
                },
                status: "UPCOMING",
            },
            data: {
                status: "COMPLETED",
            },
        });
        expect(info).toHaveBeenCalledWith("Auto-completed matches.", {
            attemptedCount: 1,
            updatedCount: 1,
        });
        expect(updatedCount).toBe(1);
    });

    it("skips the batch write when nothing needs updating", async () => {
        const today = new Date("2026-04-13T00:00:00Z");

        findMany.mockResolvedValue([
            { id: "future", date: today, time: "22:00-23:00" },
        ]);
        updateMany.mockResolvedValue({ count: 0 });

        const updatedCount = await updateMatchStatuses();

        expect(updateMany).not.toHaveBeenCalled();
        expect(updatedCount).toBe(0);
    });
});
