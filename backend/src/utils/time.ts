export interface ParsedTimeRange {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  durationMinutes: number;
  crossesMidnight: boolean;
}

const MINUTES_PER_DAY = 24 * 60;

export function parseTimeRange(timeRange?: string): ParsedTimeRange | null {
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

export function calculateDurationHours(timeRange?: string): number | null {
  const parsed = parseTimeRange(timeRange);
  if (!parsed) {
    return null;
  }

  return parsed.durationMinutes / 60;
}

export function getMatchEndDate(matchDate: Date, timeRange?: string): Date | null {
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
