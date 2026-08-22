import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMatchIdsToComplete, updateMatchStatuses } from "./match-status-utils";
import { logger } from "@/lib/logger";

function fakeStore() {
    return {
        findMany: vi.fn(),
        updateMany: vi.fn(),
    };
}

describe("getMatchIdsToComplete", () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.useFakeTimers();
        // 2026-04-13 21:00:00 WIB
        vi.setSystemTime(new Date("2026-04-13T21:00:00+07:00"));
        warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
        warnSpy.mockRestore();
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
        expect(warnSpy).toHaveBeenCalledWith("Invalid time format for match invalid: invalid");
    });
});

describe("updateMatchStatuses", () => {
    const now = new Date("2026-04-13T21:00:00+07:00");
    const today = new Date("2026-04-13T00:00:00Z");

    let store: ReturnType<typeof fakeStore>;
    let infoSpy: ReturnType<typeof vi.spyOn>;
    let errorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(now);
        infoSpy = vi.spyOn(logger, "info").mockImplementation(() => {});
        errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});
        store = fakeStore();
    });

    afterEach(() => {
        infoSpy.mockRestore();
        errorSpy.mockRestore();
        vi.useRealTimers();
    });

    it("updates eligible matches in a single batch", async () => {
        store.findMany.mockResolvedValue([
            { id: "past", date: today, time: "18:00-20:00" },
            { id: "future", date: today, time: "22:00-23:00" },
        ]);
        store.updateMany.mockResolvedValue({ count: 1 });

        const updatedCount = await updateMatchStatuses(store);

        expect(store.findMany).toHaveBeenCalledWith({
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
        expect(store.updateMany).toHaveBeenCalledWith({
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
        expect(infoSpy).toHaveBeenCalledWith("Auto-completed matches.", {
            attemptedCount: 1,
            updatedCount: 1,
        });
        expect(updatedCount).toBe(1);
    });

    it("skips the batch write when nothing needs updating", async () => {
        store.findMany.mockResolvedValue([
            { id: "future", date: today, time: "22:00-23:00" },
        ]);
        store.updateMany.mockResolvedValue({ count: 0 });

        const updatedCount = await updateMatchStatuses(store);

        expect(store.updateMany).not.toHaveBeenCalled();
        expect(updatedCount).toBe(0);
    });

    it("logs and rethrows when the batch write fails", async () => {
        store.findMany.mockRejectedValue(new Error("database down"));

        await expect(updateMatchStatuses(store)).rejects.toThrow("database down");
        expect(errorSpy).toHaveBeenCalled();
    });
});
