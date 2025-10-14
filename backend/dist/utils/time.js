"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTimeRange = parseTimeRange;
exports.calculateDurationHours = calculateDurationHours;
exports.getMatchEndDate = getMatchEndDate;
const MINUTES_PER_DAY = 24 * 60;
function parseTimeRange(timeRange) {
    if (!timeRange || !timeRange.includes('-')) {
        return null;
    }
    const [startTime, endTime] = timeRange.split('-');
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    if ([startHour, startMinute, endHour, endMinute].some((value) => Number.isNaN(value))) {
        return null;
    }
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    let durationMinutes = endTotalMinutes - startTotalMinutes;
    const crossesMidnight = durationMinutes <= 0;
    if (crossesMidnight) {
        durationMinutes += MINUTES_PER_DAY;
    }
    return {
        startHour,
        startMinute,
        endHour,
        endMinute,
        durationMinutes,
        crossesMidnight,
    };
}
function calculateDurationHours(timeRange) {
    const parsed = parseTimeRange(timeRange);
    if (!parsed) {
        return null;
    }
    return parsed.durationMinutes / 60;
}
function getMatchEndDate(matchDate, timeRange) {
    const parsed = parseTimeRange(timeRange);
    if (!parsed) {
        return null;
    }
    const endDate = new Date(matchDate);
    endDate.setHours(parsed.endHour, parsed.endMinute, 0, 0);
    if (parsed.crossesMidnight) {
        endDate.setDate(endDate.getDate() + 1);
    }
    return endDate;
}
//# sourceMappingURL=time.js.map