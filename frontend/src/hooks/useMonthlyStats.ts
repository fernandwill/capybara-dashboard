// Custom hook for fetching and managing monthly stats data

import { useState, useEffect, useMemo, useCallback } from "react";
import { authFetch } from "@/lib/authFetch";

export interface MonthlyPoint {
    month: string;
    hours: number;
    matches: number;
}

interface RawMonthly {
    [monthKey: string]: { count: number; totalHours: number };
}

const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function useMonthlyStats(selectedYear: number) {
    const [raw, setRaw] = useState<RawMonthly>({});
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchMonthly = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await authFetch("/api/stats/monthly");
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = (await response.json()) as RawMonthly;
            setRaw(data);

            const years = Array.from(
                new Set(Object.keys(data).map((key) => parseInt(key.split("-")[0], 10)))
            ).sort((a, b) => b - a);

            const currentYear = new Date().getFullYear();
            if (!years.includes(currentYear)) {
                years.unshift(currentYear);
            }
            setAvailableYears(years);
        } catch (err) {
            console.error("Error fetching monthly stats:", err);
            // Keep the previously loaded data on transient failures so the
            // chart doesn't blank out; only fall back on a true first load.
            setAvailableYears((prev) =>
                prev.length > 0 ? prev : [new Date().getFullYear()]
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMonthly();
    }, [fetchMonthly]);

    // Build the 12-month series for the selected year
    const monthlyData = useMemo<MonthlyPoint[]>(() => {
        return MONTH_NAMES.map((monthName, index) => {
            const monthKey = `${selectedYear}-${String(index + 1).padStart(2, "0")}`;
            const stats = raw[monthKey] || { count: 0, totalHours: 0 };

            return {
                month: monthName,
                hours: Math.round(stats.totalHours * 10) / 10,
                matches: stats.count,
            };
        });
    }, [raw, selectedYear]);

    return {
        monthlyData,
        availableYears,
        isLoading,
        fetchMonthly,
        raw,
    };
}
