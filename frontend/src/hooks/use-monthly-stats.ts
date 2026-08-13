// Custom hook for fetching and processing monthly statistics.
//
// Backed by SWR: the "/api/stats/monthly" key is cached globally and deduped
// across pages. SWR fetches on mount (replacing the old mount effect), so the
// raw data arrives automatically and realtime keeps it fresh.

import { useMemo, useCallback } from "react";
import useSWR from "swr";

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
    const {
        data: raw = {},
        isLoading,
        mutate,
    } = useSWR<RawMonthly>("/api/stats/monthly");

    const fetchMonthly = useCallback(async () => {
        await mutate();
    }, [mutate]);

    // Available years derived from the fetched data; always include the
    // current year even if it has no completed matches yet.
    const availableYears = useMemo(() => {
        const years = Array.from(
            new Set(Object.keys(raw).map((key) => parseInt(key.split("-")[0], 10)))
        ).sort((a, b) => b - a);

        const currentYear = new Date().getFullYear();
        if (!years.includes(currentYear)) {
            years.unshift(currentYear);
        }
        return years;
    }, [raw]);

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
