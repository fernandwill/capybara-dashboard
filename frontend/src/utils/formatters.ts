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
 * Formats a time range string and appends the duration in hours.
 * Input: "18:00-20:00" -> Output: "18:00-20:00 (2 hrs)"
 */
export function formatTimeWithDuration(timeString: string): string {
    if (!timeString || !timeString.includes("-")) {
        return timeString;
    }

    try {
        const [startTime, endTime] = timeString.split("-").map((t) => t.trim());
        const [startHours, startMinutes] = startTime.split(":").map(Number);
        const [endHours, endMinutes] = endTime.split(":").map(Number);

        if (
            isNaN(startHours) ||
            isNaN(startMinutes) ||
            isNaN(endHours) ||
            isNaN(endMinutes)
        ) {
            return timeString;
        }

        const startDate = new Date();
        startDate.setHours(startHours, startMinutes, 0, 0);

        const endDate = new Date();
        endDate.setHours(endHours, endMinutes, 0, 0);

        let durationMillis = endDate.getTime() - startDate.getTime();
        if (durationMillis < 0) {
            // Handle overnight case
            const dayInMillis = 24 * 60 * 60 * 1000;
            durationMillis += dayInMillis;
        }

        const durationHours = durationMillis / (1000 * 60 * 60);
        const roundedDuration = Math.round(durationHours * 10) / 10;

        return `${timeString} (${roundedDuration} hrs)`;
    } catch (error) {
        console.error("Error formatting time with duration:", error);
        return timeString;
    }
}
