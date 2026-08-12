import { describe, it, expect } from "vitest";
import {
    formatDate,
    formatCurrency,
    formatDurationHours,
    formatShortDate,
    formatTimeWithDuration,
} from "./formatters";

describe("formatShortDate", () => {
    it("formats a date into a day + month label", () => {
        // Use noon UTC to avoid timezone shifting the day
        const result = formatShortDate("2025-01-15T12:00:00.000Z");
        expect(result).toBe("15 JAN");
    });

    it("pads single-digit days", () => {
        const result = formatShortDate("2025-08-08T12:00:00.000Z");
        expect(result).toBe("08 AUG");
    });

    it("returns '--' for invalid dates", () => {
        expect(formatShortDate("not-a-date")).toBe("--");
        expect(formatShortDate("")).toBe("--");
    });
});

describe("formatDate", () => {
    it("formats a valid date string correctly", () => {
        // Jan 15, 2025 is a Wednesday
        const result = formatDate("2025-01-15T00:00:00.000Z");
        expect(result).toContain("15");
        expect(result).toContain("January");
        expect(result).toContain("2025");
    });

    it("returns 'Invalid Date' for invalid date strings", () => {
        expect(formatDate("not-a-date")).toBe("Invalid Date");
        expect(formatDate("")).toBe("Invalid Date");
    });
});

describe("formatCurrency", () => {
    it("formats a number as Indonesian Rupiah", () => {
        const result = formatCurrency(150000);
        // Should contain "Rp" and the number formatted with thousands separator
        expect(result).toContain("Rp");
        expect(result).toContain("150");
    });

    it("handles zero", () => {
        const result = formatCurrency(0);
        expect(result).toContain("Rp");
        expect(result).toContain("0");
    });

    it("handles negative numbers", () => {
        const result = formatCurrency(-50000);
        expect(result).toContain("Rp");
        expect(result).toContain("50");
    });
});

describe("formatTimeWithDuration", () => {
    it("formats a time range and calculates duration", () => {
        const result = formatTimeWithDuration("18:00-20:00");
        expect(result).toBe("18:00-20:00 (2 hrs)");
    });

    it("handles fractional hours", () => {
        const result = formatTimeWithDuration("18:00-19:30");
        expect(result).toBe("18:00-19:30 (1.5 hrs)");
    });

    it("returns the input if no hyphen is present", () => {
        const result = formatTimeWithDuration("18:00");
        expect(result).toBe("18:00");
    });

    it("returns the input for empty string", () => {
        const result = formatTimeWithDuration("");
        expect(result).toBe("");
    });

    it("handles overnight time ranges", () => {
        const result = formatTimeWithDuration("22:00-02:00");
        expect(result).toBe("22:00-02:00 (4 hrs)");
    });
});

describe("formatDurationHours", () => {
    it("formats a time range as a one-decimal hour label", () => {
        expect(formatDurationHours("18:00-20:00")).toBe("2.0 h");
    });

    it("handles fractional hours", () => {
        expect(formatDurationHours("18:00-19:30")).toBe("1.5 h");
    });

    it("handles overnight time ranges", () => {
        expect(formatDurationHours("22:00-02:00")).toBe("4.0 h");
    });

    it("returns '--' for malformed input", () => {
        expect(formatDurationHours("18:00")).toBe("--");
        expect(formatDurationHours("")).toBe("--");
        expect(formatDurationHours("not-a-time")).toBe("--");
    });
});
