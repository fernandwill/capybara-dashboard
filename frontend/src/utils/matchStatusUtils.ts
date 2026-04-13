// Match status utility functions
// Consolidates duplicated status update logic from multiple route files

import prisma from "@/lib/database";
import { logger } from "@/lib/logger";

type MatchStatus = "UPCOMING" | "COMPLETED";
type MatchStatusUpdateCandidate = {
    id: string;
    date: Date;
    time: string;
};

/**
 * Parses end time from a time range string like "18:00-20:00"
 * Returns [hours, minutes] or null if parsing fails
 */
function parseEndTime(timeString: string): [number, number] | null {
    const timeParts = timeString.split("-");
    if (timeParts.length !== 2) {
        return null;
    }

    const endTime = timeParts[1].trim();
    const [hours, minutes] = endTime.split(":").map(Number);

    if (isNaN(hours) || isNaN(minutes)) {
        return null;
    }

    return [hours, minutes];
}

/**
 * Determines the correct match status based on date and time.
 * Returns "COMPLETED" if the match end time has passed, otherwise returns the current status.
 */
export function determineMatchStatus(
    date: string | Date,
    time: string,
    currentStatus: string
): MatchStatus {
    if (currentStatus !== "UPCOMING") {
        return currentStatus as MatchStatus;
    }

    try {
        const now = new Date();
        const matchDate = new Date(date);
        const endTimeParts = parseEndTime(time);

        if (!endTimeParts) {
            return currentStatus as MatchStatus;
        }

        const [endHour, endMin] = endTimeParts;
        const matchEndDate = new Date(matchDate);
        matchEndDate.setHours(endHour, endMin, 0, 0);

        if (matchEndDate < now) {
            return "COMPLETED";
        }

        return "UPCOMING";
    } catch (error) {
        logger.warn("Error determining match status", error);
        return currentStatus as MatchStatus;
    }
}

/**
 * Returns upcoming match IDs whose end time has already passed.
 */
export function getMatchIdsToComplete(
    matches: MatchStatusUpdateCandidate[],
    now: Date = new Date()
): string[] {
    const matchIdsToComplete: string[] = [];

    for (const match of matches) {
        const endTimeParts = parseEndTime(match.time);

        if (!endTimeParts) {
            logger.warn(`Invalid time format for match ${match.id}: ${match.time}`);
            continue;
        }

        const [endHour, endMin] = endTimeParts;
        const matchEndDate = new Date(match.date);
        matchEndDate.setHours(endHour, endMin, 0, 0);

        if (matchEndDate < now) {
            matchIdsToComplete.push(match.id);
        }
    }

    return matchIdsToComplete;
}

/**
 * Batch updates all matches that should be marked as COMPLETED.
 * Checks upcoming matches where the end time has passed.
 * Returns the count of updated matches.
 */
export async function updateMatchStatuses(): Promise<number> {
    try {
        const now = new Date();

        const upcomingMatches = await prisma.match.findMany({
            where: {
                status: "UPCOMING",
                date: {
                    lte: now, // Only check matches that are today or in the past
                },
            },
            select: {
                id: true,
                date: true,
                time: true,
            },
        });

        const matchIdsToComplete = getMatchIdsToComplete(upcomingMatches, now);

        if (matchIdsToComplete.length === 0) {
            return 0;
        }

        const result = await prisma.match.updateMany({
            where: {
                id: {
                    in: matchIdsToComplete,
                },
                status: "UPCOMING",
            },
            data: {
                status: "COMPLETED",
            },
        });

        logger.info("Auto-completed matches.", {
            attemptedCount: matchIdsToComplete.length,
            updatedCount: result.count,
        });

        return result.count;
    } catch (error) {
        logger.error("Error updating match statuses", error);
        throw error;
    }
}
