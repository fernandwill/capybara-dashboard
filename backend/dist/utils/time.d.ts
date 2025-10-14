export interface ParsedTimeRange {
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
    durationMinutes: number;
    crossesMidnight: boolean;
}
export declare function parseTimeRange(timeRange?: string): ParsedTimeRange | null;
export declare function calculateDurationHours(timeRange?: string): number | null;
export declare function getMatchEndDate(matchDate: Date, timeRange?: string): Date | null;
//# sourceMappingURL=time.d.ts.map