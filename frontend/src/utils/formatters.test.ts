import { describe, it, expect } from "vitest";
import { formatDate, formatCurrency, formatTimeWithDuration } from "./formatters";

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
