// Match-related utility functions

import { Match, SortOption } from "@/types/types";

/**
 * Parses a date string and returns the timestamp, or 0 if invalid.
 */
export function parseDate(dateString: string): number {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 0 : date.getTime();
}

/**
 * Parses a time string like "18:00" and returns [hours, minutes].
 * Returns [0, 0] if parsing fails.
 */
function parseTime(timeString: string): [number, number] {
    try {
        const [hours, minutes] = timeString.split(":").map(Number);
        if (isNaN(hours) || isNaN(minutes)) {
            return [0, 0];
        }
        return [hours, minutes];
    } catch {
        return [0, 0];
    }
}

/**
 * Compares two matches by date and start time.
 * Returns negative if a < b, positive if a > b, 0 if equal.
 */
function compareByDateTime(a: Match, b: Match, ascending: boolean = true): number {
    const multiplier = ascending ? 1 : -1;
    const dateDiff = parseDate(a.date) - parseDate(b.date);

    if (dateDiff !== 0) {
        return dateDiff * multiplier;
    }

    // Same date, compare by start time
    const timeA = a.time.split("-")[0].trim();
    const timeB = b.time.split("-")[0].trim();
    const [hoursA, minutesA] = parseTime(timeA);
    const [hoursB, minutesB] = parseTime(timeB);

    if (hoursA !== hoursB) {
        return (hoursA - hoursB) * multiplier;
    }
    return (minutesA - minutesB) * multiplier;
}

/**
 * Sorts an array of matches based on the selected sort option.
 */
export function sortMatches(matches: Match[], sortOption: SortOption): Match[] {
    return [...matches].sort((a, b) => {
        switch (sortOption) {
            case "date-earliest":
                return compareByDateTime(a, b, true);
            case "date-latest":
                return compareByDateTime(a, b, false);
            case "fee-low":
                return a.fee - b.fee;
            case "fee-high":
                return b.fee - a.fee;
            default:
                return compareByDateTime(a, b, true);
        }
    });
}

/**
 * Finds the closest upcoming match from an array of matches.
 */
export function getClosestUpcomingMatch(matches: Match[]): Match | null {
    const upcomingMatches = matches
        .filter((match) => match.status === "UPCOMING")
        .sort((a, b) => compareByDateTime(a, b, true));

    return upcomingMatches.length > 0 ? upcomingMatches[0] : null;
}

/**
 * Computes the time remaining until a match's start time.
 * Returns null when the date/time cannot be parsed, and `started: true` once
 * the start time has passed.
 */
export function getMatchCountdown(
    match: Match
): { days: number; hours: number; minutes: number; started: boolean } | null {
    try {
        const matchDate = new Date(match.date);
        const timeString = match.time.split("-")[0].trim();
        const [hours, minutes] = timeString.split(":").map(Number);

        const matchDateTime = new Date(matchDate);
        matchDateTime.setHours(hours, minutes, 0, 0);

        const timeDiff = matchDateTime.getTime() - Date.now();

        if (timeDiff <= 0) {
            return { days: 0, hours: 0, minutes: 0, started: true };
        }

        return {
            days: Math.floor(timeDiff / (1000 * 60 * 60 * 24)),
            hours: Math.floor(
                (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
            ),
            minutes: Math.floor(
                (timeDiff % (1000 * 60 * 60)) / (1000 * 60)
            ),
            started: false,
        };
    } catch {
        return null;
    }
}
