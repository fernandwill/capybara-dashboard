import { Match, PaymentStatus, SortOption } from "../types";

type ActiveTab = "upcoming" | "past";

const IDR_FORMATTER = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

const normalizeDate = (dateString: string): number => {
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const getStartTime = (timeString: string) => {
  try {
    const [start] = timeString.split("-");
    const [hours, minutes] = start.trim().split(":").map(Number);
    return { hours, minutes };
  } catch {
    return { hours: NaN, minutes: NaN };
  }
};

const compareStartTimes = (first: Match, second: Match, reverse = false) => {
  try {
    const firstTime = getStartTime(first.time);
    const secondTime = getStartTime(second.time);

    if (Number.isNaN(firstTime.hours) || Number.isNaN(secondTime.hours)) {
      return 0;
    }

    if (firstTime.hours !== secondTime.hours) {
      return reverse
        ? secondTime.hours - firstTime.hours
        : firstTime.hours - secondTime.hours;
    }

    return reverse
      ? secondTime.minutes - firstTime.minutes
      : firstTime.minutes - secondTime.minutes;
  } catch {
    return 0;
  }
};

export const sortMatches = (matches: Match[], sortOption: SortOption): Match[] => {
  return [...matches].sort((a, b) => {
    switch (sortOption) {
      case "date-earliest": {
        const dateDiff = normalizeDate(a.date) - normalizeDate(b.date);
        if (dateDiff !== 0) return dateDiff;
        return compareStartTimes(a, b);
      }
      case "date-latest": {
        const dateDiff = normalizeDate(b.date) - normalizeDate(a.date);
        if (dateDiff !== 0) return dateDiff;
        return compareStartTimes(a, b, true);
      }
      case "fee-low":
        return a.fee - b.fee;
      case "fee-high":
        return b.fee - a.fee;
      default:
        return 0;
    }
  });
};

export const filterMatches = (
  matches: Match[],
  activeTab: ActiveTab,
  searchQuery: string,
  sortBy: SortOption
) => {
  const filtered = matches.filter((match) => {
    const matchesTab =
      activeTab === "upcoming"
        ? match.status === "UPCOMING"
        : match.status === "COMPLETED";

    if (!matchesTab) return false;

    if (!searchQuery) return true;

    const normalizedQuery = searchQuery.toLowerCase();
    return (
      match.title.toLowerCase().includes(normalizedQuery) ||
      match.location.toLowerCase().includes(normalizedQuery)
    );
  });

  return sortMatches(filtered, sortBy);
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "Invalid Date";
  }

  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const year = date.getFullYear();

  return `${weekday}, ${day} ${month} ${year}`;
};

export const formatCurrency = (amount: number) => IDR_FORMATTER.format(amount);

export const formatTimeWithDuration = (timeString: string) => {
  if (!timeString.includes("-")) {
    return timeString;
  }

  try {
    const [startTime, endTime] = timeString.split("-").map((time) => time.trim());
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);

    if (
      Number.isNaN(startHours) ||
      Number.isNaN(startMinutes) ||
      Number.isNaN(endHours) ||
      Number.isNaN(endMinutes)
    ) {
      return timeString;
    }

    const startDate = new Date();
    startDate.setHours(startHours, startMinutes, 0, 0);

    const endDate = new Date();
    endDate.setHours(endHours, endMinutes, 0, 0);

    let durationMillis = endDate.getTime() - startDate.getTime();
    if (durationMillis < 0) {
      durationMillis += 24 * 60 * 60 * 1000;
    }

    const durationHours = durationMillis / (1000 * 60 * 60);
    const roundedDuration = Math.round(durationHours * 10) / 10;

    return `${startTime}-${endTime} (${roundedDuration} hrs)`;
  } catch (error) {
    console.error("Error formatting time with duration:", error);
    return timeString;
  }
};

export const areAllPlayersPaid = (match: Match) => {
  const players = match.players ?? [];
  if (players.length === 0) return false;

  return players.every(
    (playerMatch) => playerMatch.paymentStatus === ("SUDAH_SETOR" as PaymentStatus)
  );
};

export const getPendingPaymentCount = (match: Match) => {
  const players = match.players ?? [];
  if (players.length === 0) return 0;

  return players.filter(
    (playerMatch) => playerMatch.paymentStatus === ("BELUM_SETOR" as PaymentStatus)
  ).length;
};

const getMatchStartDate = (match: Match) => {
  try {
    const matchDate = new Date(match.date);
    const { hours, minutes } = getStartTime(match.time);

    if (Number.isNaN(matchDate.getTime()) || Number.isNaN(hours) || Number.isNaN(minutes)) {
      return null;
    }

    const matchDateTime = new Date(matchDate);
    matchDateTime.setHours(hours, minutes, 0, 0);
    return matchDateTime;
  } catch {
    return null;
  }
};

export const getClosestUpcomingMatch = (matches: Match[]): Match | null => {
  const upcomingMatches = matches
    .filter((match) => match.status === "UPCOMING")
    .map((match) => ({ match, date: getMatchStartDate(match) }))
    .filter((entry): entry is { match: Match; date: Date } => Boolean(entry.date))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return upcomingMatches.length > 0 ? upcomingMatches[0].match : null;
};

export const getCountdownLabel = (match: Match | null) => {
  if (!match) return "";

  const matchDate = getMatchStartDate(match);
  if (!matchDate) return "Time pending";

  const now = new Date();
  const timeDiff = matchDate.getTime() - now.getTime();

  if (timeDiff <= 0) return "Match Started";

  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return "Starting soon";
};
