export interface TimeParts {
  hours: number;
  minutes: number;
}

const padNumber = (value: number): string => value.toString().padStart(2, "0");

const clampMinutes = (minutes: number): boolean => minutes >= 0 && minutes < 60;

export const parseTimeString = (value: string): TimeParts | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const amPmMatch = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (amPmMatch) {
    const rawHours = Number.parseInt(amPmMatch[1], 10);
    const rawMinutes = amPmMatch[2] ? Number.parseInt(amPmMatch[2], 10) : 0;
    const meridiem = amPmMatch[3].toUpperCase();

    if (Number.isNaN(rawHours) || Number.isNaN(rawMinutes) || !clampMinutes(rawMinutes)) {
      return null;
    }

    let hours = rawHours % 12;
    if (meridiem === "PM") {
      hours += 12;
    }

    return {
      hours,
      minutes: rawMinutes,
    };
  }

  const twentyFourHourMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHourMatch) {
    const hours = Number.parseInt(twentyFourHourMatch[1], 10);
    const minutes = Number.parseInt(twentyFourHourMatch[2], 10);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      !clampMinutes(minutes)
    ) {
      return null;
    }

    return {
      hours,
      minutes,
    };
  }

  return null;
};

export const formatTimeParts = (parts: TimeParts): string => {
  return `${padNumber(parts.hours)}:${padNumber(parts.minutes)}`;
};

export const formatTimeTo24Hour = (value: string): string => {
  const parsed = parseTimeString(value);
  if (!parsed) {
    return value.trim();
  }
  return formatTimeParts(parsed);
};

export interface ParsedTimeRange {
  start: TimeParts;
  end: TimeParts;
  startLabel: string;
  endLabel: string;
  durationMinutes: number;
}

const parseTimeRangeInternal = (range: string): ParsedTimeRange | null => {
  if (!range || !range.includes("-")) {
    return null;
  }

  const parts = range.split("-");
  const startRaw = parts[0]?.trim() ?? "";
  const endRaw = parts[parts.length - 1]?.trim() ?? "";

  if (!startRaw || !endRaw) {
    return null;
  }

  const start = parseTimeString(startRaw);
  const end = parseTimeString(endRaw);

  if (!start || !end) {
    return null;
  }

  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;

  let durationMinutes = endMinutes - startMinutes;
  if (durationMinutes < 0) {
    durationMinutes += 24 * 60;
  }

  return {
    start,
    end,
    startLabel: formatTimeParts(start),
    endLabel: formatTimeParts(end),
    durationMinutes,
  };
};

export const parseTimeRange = (range: string): ParsedTimeRange | null => {
  return parseTimeRangeInternal(range);
};

export const getTimeRangeStart = (range: string): TimeParts | null => {
  const parsed = parseTimeRangeInternal(range);
  if (parsed) {
    return parsed.start;
  }

  if (!range) {
    return null;
  }

  const [startPart] = range.split("-");
  return parseTimeString(startPart ?? "");
};

export const getTimeRangeEnd = (range: string): TimeParts | null => {
  const parsed = parseTimeRangeInternal(range);
  if (parsed) {
    return parsed.end;
  }

  if (!range) {
    return null;
  }

  const parts = range.split("-");
  const endPart = parts[parts.length - 1];
  return parseTimeString(endPart ?? "");
};

export const getTimeRangeStartMinutes = (range: string): number | null => {
  const start = getTimeRangeStart(range);
  if (!start) {
    return null;
  }

  return start.hours * 60 + start.minutes;
};

export const formatTimeRange = (range: string): string => {
  if (!range) {
    return "";
  }

  const parsed = parseTimeRangeInternal(range);
  if (!parsed) {
    if (!range.includes("-")) {
      return formatTimeTo24Hour(range);
    }

    const parts = range.split("-");
    const startLabel = formatTimeTo24Hour(parts[0] ?? "");
    const endLabel = formatTimeTo24Hour(parts[parts.length - 1] ?? "");

    return endLabel ? `${startLabel} - ${endLabel}` : startLabel;
  }

  return `${parsed.startLabel} - ${parsed.endLabel}`;
};

export const formatTimeWithDuration = (range: string): string => {
  if (!range) {
    return "";
  }

  const parsed = parseTimeRangeInternal(range);
  if (!parsed) {
    return formatTimeRange(range);
  }

  const durationHours = parsed.durationMinutes / 60;
  const roundedDuration = Math.round(durationHours * 10) / 10;
  return `${parsed.startLabel} - ${parsed.endLabel} (${roundedDuration} hrs)`;
};
