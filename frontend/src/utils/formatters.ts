// Formatting utility functions

/**
 * Formats a date string into a readable format: "Wed, 15 January 2025"
 */
export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return "Invalid Date";
    }

    const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "long" });
    const year = date.getFullYear();
    return `${weekday}, ${day} ${month} ${year}`;
}

/**
 * Formats a date string into a short "DD MMM" label, e.g. "08 AUG".
 */
export function formatShortDate(dateString: string): string {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return "--";
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    return `${day} ${month}`;
}

/**
 * Formats a number as Indonesian Rupiah currency
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

/**
 * Parses a "HH:MM-HH:MM" time range into total minutes, handling overnight.
 * Returns null when the input cannot be parsed.
 */
function parseTimeRangeMinutes(timeString: string): number | null {
    if (!timeString || !timeString.includes("-")) {
        return null;
    }

    const [startTime, endTime] = timeString.split("-").map((t) => t.trim());
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);

    if (
        isNaN(startHours) ||
        isNaN(startMinutes) ||
        isNaN(endHours) ||
        isNaN(endMinutes)
    ) {
        return null;
    }

    const startTotal = startHours * 60 + startMinutes;
    let endTotal = endHours * 60 + endMinutes;
    if (endTotal < startTotal) {
        // Handle overnight case
        endTotal += 24 * 60;
    }

    return endTotal - startTotal;
}

/**
 * Formats a time range string and appends the duration in hours.
 * Input: "18:00-20:00" -> Output: "18:00-20:00 (2 hrs)"
 */
export function formatTimeWithDuration(timeString: string): string {
    const durationMinutes = parseTimeRangeMinutes(timeString);
    if (durationMinutes === null) {
        return timeString;
    }

    const durationHours = durationMinutes / 60;
    const roundedDuration = Math.round(durationHours * 10) / 10;

    return `${timeString} (${roundedDuration} hrs)`;
}

/**
 * Formats a time range string into a compact duration label, e.g. "2.0 h".
 * Input: "18:00-20:00" -> Output: "2.0 h". Returns "--" when it cannot parse.
 */
export function formatDurationHours(timeString: string): string {
    const durationMinutes = parseTimeRangeMinutes(timeString);
    if (durationMinutes === null) {
        return "--";
    }

    return `${(durationMinutes / 60).toFixed(1)} h`;
}
