"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  Hash,
  Moon,
  MoreVertical,
  Star,
  TrendingUp,
  Trophy,
  UserCircle,
  Zap,
  Clock,
  Users,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import NewMatchModal from "../components/NewMatchModal";
import SuccessModal from "../components/SuccessModal";
import ErrorModal from "../components/ErrorModal";
import MatchDetailsModal from "../components/MatchDetailsModal";
import DeleteMatchModal from "../components/DeleteMatchModal";
import { signOut } from "@/lib/authService";
import { Match, ModalState } from "@/types/types";
import { formatCurrency, formatShortDate } from "@/utils/formatters";
import {
  sortMatches,
  getClosestUpcomingMatch,
  areAllPlayersPaid,
  getPendingPaymentCount,
} from "@/utils/matchUtils";
import { useStats } from "@/hooks/useStats";
import { useMatches } from "@/hooks/useMatches";
import { useMonthlyStats, MonthlyPoint } from "@/hooks/useMonthlyStats";
import { useCountdown } from "@/hooks/useCountdown";

// Constants
const BACKGROUND_REFRESH_INTERVAL_MS = 60 * 1000;
const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const accentStyles = {
  green: { icon: "bg-emerald-500/20 text-emerald-400" },
  blue: { icon: "bg-blue-500/20 text-blue-400" },
  purple: { icon: "bg-violet-500/20 text-violet-400" },
  orange: { icon: "bg-orange-500/20 text-orange-400" },
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatHourRange(startHour: number, span = 2): string {
  const format = (hour: number) => {
    const normalized = ((hour % 24) + 24) % 24;
    const twelve = normalized % 12 === 0 ? 12 : normalized % 12;
    return `${twelve}${normalized < 12 ? "AM" : "PM"}`;
  };
  return `${format(startHour)} - ${format(startHour + span)}`;
}

function ActivityChart({
  data,
  mode,
  selectedYear,
}: {
  data: MonthlyPoint[];
  mode: "hours" | "matches";
  selectedYear: number;
}) {
  const rawMax = Math.max(
    0,
    ...data.map((item) => (mode === "hours" ? item.hours : item.matches))
  );
  const gridMax = Math.max(
    mode === "hours" ? 16 : 4,
    Math.ceil(rawMax / 4) * 4
  );
  const gridLines = [gridMax, (gridMax * 3) / 4, gridMax / 2, gridMax / 4, 0];

  return (
    <div className="mt-8">
      <div className="relative h-[250px]">
        {/* Grid */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {gridLines.map((value) => (
            <div key={value} className="flex items-center gap-3">
              <span className="w-7 text-right text-[10px] text-white/40">
                {mode === "hours" ? `${value}h` : value}
              </span>

              <div className="h-px flex-1 bg-white/[0.07]" />
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="absolute bottom-0 left-10 right-0 top-0 flex items-end gap-3">
          {data.map((item) => {
            const value = mode === "hours" ? item.hours : item.matches;
            const height =
              value === 0 ? 0 : Math.max((value / gridMax) * 100, 2);

            return (
              <div
                key={item.month}
                className="group flex h-full flex-1 flex-col justify-end"
              >
                <div className="relative flex flex-1 items-end justify-center">
                  {value > 0 && (
                    <div
                      className="relative w-5 rounded-t-sm bg-emerald-500/90 transition hover:bg-emerald-400"
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/[0.1] bg-[#1c1d1d] px-4 py-3 shadow-xl group-hover:block">
                        <div className="text-xs font-medium">
                          {item.month} {selectedYear}
                        </div>

                        <div className="mt-2 space-y-1 text-xs text-white/60">
                          <div>🔵 {item.matches} matches</div>
                          <div>🟢 {item.hours} hours</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <span className="mt-3 text-center text-[10px] text-white/50">
                  {item.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { setUser } = useAuth();

  // Data hooks
  const { stats, fetchStats, isLoading: isStatsLoading } = useStats();
  const {
    matches,
    fetchMatches,
    createMatch,
    updateMatch,
    deleteMatch,
    isLoading: isMatchesLoading,
  } = useMatches();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const {
    monthlyData,
    availableYears,
    isLoading: isMonthlyLoading,
    fetchMonthly,
    raw: rawMonthly,
  } = useMonthlyStats(selectedYear);

  // UI state
  const [isYearMenuOpen, setIsYearMenuOpen] = useState(false);
  const [chartMode, setChartMode] = useState<"hours" | "matches">("hours");
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [menu, setMenu] = useState<{ match: Match; x: number; y: number } | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [matchPendingDeletion, setMatchPendingDeletion] = useState<Match | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Loading states
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingMatch, setIsDeletingMatch] = useState(false);

  // Feedback modals
  const [successModal, setSuccessModal] = useState<ModalState>({
    isOpen: false,
    title: "",
    message: "",
  });
  const [errorModal, setErrorModal] = useState<ModalState>({
    isOpen: false,
    title: "",
    message: "",
  });

  // Computed values
  const closestMatch = getClosestUpcomingMatch(matches);
  const countdown = useCountdown(closestMatch);

  const upcomingMatches = useMemo(
    () => sortMatches(matches.filter((m) => m.status === "UPCOMING"), "date-earliest"),
    [matches]
  );
  const completedMatches = useMemo(
    () => sortMatches(matches.filter((m) => m.status === "COMPLETED"), "date-latest"),
    [matches]
  );
  const recentMatches = showAllRecent ? completedMatches : completedMatches.slice(0, 5);

  // Year-scoped figures for the selected year
  const yearHours = monthlyData.reduce((sum, m) => sum + m.hours, 0);
  const yearMatches = monthlyData.reduce((sum, m) => sum + m.matches, 0);

  // All-time average hours per active month
  const allTimeHours = Object.values(rawMonthly).reduce(
    (sum, value) => sum + (value.totalHours || 0),
    0
  );
  const activeMonths = Object.values(rawMonthly).filter((value) => value.count > 0).length;
  const avgHoursPerMonth = activeMonths > 0 ? allTimeHours / activeMonths : 0;

  // Insights
  const strongestMonth = useMemo(() => {
    const sorted = [...monthlyData].sort((a, b) => b.hours - a.hours);
    return sorted[0] && sorted[0].hours > 0 ? sorted[0] : null;
  }, [monthlyData]);

  const mostActiveDay = useMemo(() => {
    const counts = new Map<string, number>();
    for (const match of completedMatches) {
      const date = new Date(match.date);
      if (isNaN(date.getTime())) continue;
      const name = WEEKDAY_NAMES[date.getDay()];
      counts.set(name, (counts.get(name) || 0) + 1);
    }

    let best: string | null = null;
    let bestCount = 0;
    counts.forEach((count, name) => {
      if (count > bestCount) {
        bestCount = count;
        best = name;
      }
    });
    return best;
  }, [completedMatches]);

  const typicalStartHour = useMemo(() => {
    const counts = new Map<number, number>();
    for (const match of completedMatches) {
      const start = match.time.split("-")[0].trim();
      const hour = parseInt(start.split(":")[0], 10);
      if (!isNaN(hour)) {
        counts.set(hour, (counts.get(hour) || 0) + 1);
      }
    }

    let best: number | null = null;
    let bestCount = 0;
    counts.forEach((count, hour) => {
      if (count > bestCount) {
        bestCount = count;
        best = hour;
      }
    });
    return best;
  }, [completedMatches]);

  // Force dark theme for the whole app (matches the new design)
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Initial data fetch and read-only refresh interval
  useEffect(() => {
    const refreshDashboardData = () => {
      void fetchStats();
      void fetchMatches();
      void fetchMonthly();
    };

    refreshDashboardData();

    const intervalId = setInterval(refreshDashboardData, BACKGROUND_REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [fetchStats, fetchMatches, fetchMonthly]);

  // Logout handler
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const { success, error } = await signOut();
      if (!success) {
        setErrorModal({
          isOpen: true,
          title: "Logout Failed",
          message: error || "Failed to sign out. Please try again.",
        });
        return;
      }
      setUser(null);
    } catch (logoutError) {
      console.error("Error signing out:", logoutError);
      setErrorModal({
        isOpen: true,
        title: "Logout Failed",
        message: "An unexpected error occurred while signing out.",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Modal handlers
  const handleNewMatch = () => setIsModalOpen(true);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMatch(null);
  };

  const handleEditMatch = (match: Match) => {
    setEditingMatch(match);
    setIsModalOpen(true);
  };

  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedMatch(null);
  };

  const handleRequestDeleteMatch = (match: Match) => {
    setMatchPendingDeletion(match);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setMatchPendingDeletion(null);
  };

  const handleCloseSuccessModal = () => {
    setSuccessModal({ isOpen: false, title: "", message: "" });
  };

  const handleCloseErrorModal = () => {
    setErrorModal({ isOpen: false, title: "", message: "" });
  };

  // Row action menu
  const openRowMenu = (event: React.MouseEvent<HTMLButtonElement>, match: Match) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 144;
    setMenu({ match, x: Math.max(8, rect.right - menuWidth), y: rect.bottom });
  };

  const closeRowMenu = () => setMenu(null);

  // Delete match handler
  const handleConfirmDeleteMatch = async () => {
    if (!matchPendingDeletion) return;

    setIsDeletingMatch(true);
    try {
      const success = await deleteMatch(matchPendingDeletion.id);

      if (success) {
        if (selectedMatch?.id === matchPendingDeletion.id) {
          handleCloseDetailsModal();
        }
        fetchStats();
        handleCloseDeleteModal();
        setSuccessModal({
          isOpen: true,
          title: "Success!",
          message: "Match deleted successfully!",
        });
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      console.error("Error deleting match:", error);
      setErrorModal({
        isOpen: true,
        title: "Error!",
        message: "Failed to delete match. Please try again.",
      });
    } finally {
      setIsDeletingMatch(false);
    }
  };

  // Submit match handler (create/update)
  const handleSubmitMatch = async (matchData: {
    title: string;
    location: string;
    courtNumber: string;
    date: string;
    time: string;
    fee: number;
    status: string;
    description?: string;
    playerIds?: string[];
  }) => {
    try {
      const isEditing = editingMatch !== null;

      const success = isEditing
        ? await updateMatch(editingMatch.id, matchData)
        : await createMatch(matchData);

      if (!success) {
        throw new Error("Operation failed");
      }

      setIsModalOpen(false);
      setEditingMatch(null);
      fetchStats();

      setSuccessModal({
        isOpen: true,
        title: "Success!",
        message: `Match ${isEditing ? "updated" : "created"} successfully!`,
      });
    } catch (error) {
      console.error(`Error ${editingMatch ? "updating" : "creating"} match:`, error);
      setErrorModal({
        isOpen: true,
        title: "Error!",
        message: `Failed to ${editingMatch ? "update" : "create"} match. Please try again.`,
      });
    }
  };

  const isLoadingFirstPass = isMatchesLoading && matches.length === 0;
  const showStatsLoading =
    isStatsLoading &&
    stats.totalMatches === 0 &&
    stats.upcomingMatches === 0 &&
    stats.completedMatches === 0 &&
    stats.hoursPlayed === "0.0";

  const statCards = [
    {
      label: "Total Matches",
      value: String(stats.totalMatches),
      trend: `${yearMatches} in ${selectedYear}`,
      icon: Zap,
      accent: "green" as const,
    },
    {
      label: "Hours Played",
      value: stats.hoursPlayed,
      suffix: "h",
      trend: `${yearHours.toFixed(1)}h in ${selectedYear}`,
      icon: Clock3,
      accent: "blue" as const,
    },
    {
      label: "Upcoming",
      value: String(stats.upcomingMatches),
      trend: closestMatch
        ? `Next: ${formatShortDate(closestMatch.date)}`
        : "No matches scheduled",
      icon: CalendarDays,
      accent: "purple" as const,
    },
    {
      label: "Avg / Month",
      value: avgHoursPerMonth.toFixed(1),
      suffix: "h",
      trend: `${activeMonths} active months`,
      icon: TrendingUp,
      accent: "orange" as const,
    },
  ];

  return (
    <main className="min-h-screen bg-[#080909] text-white">
      <div className="mx-auto max-w-[1440px] px-6 py-5 lg:px-8">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/[0.08] pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white">
              <span className="text-xl">🐹</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold tracking-tight">
                Capybara
              </span>
              <span className="text-emerald-400">✦</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Year selector */}
            <div className="relative">
              <button
                type="button"
                className="flex h-10 items-center gap-6 rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 text-sm text-white transition hover:bg-white/[0.06]"
                onClick={() => setIsYearMenuOpen(!isYearMenuOpen)}
              >
                {selectedYear}
                <ChevronDown
                  size={16}
                  className={`text-white/50 transition-transform duration-200 ${
                    isYearMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isYearMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsYearMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-24 overflow-hidden rounded-lg border border-white/[0.1] bg-[#1c1d1d] py-1 text-sm shadow-xl">
                    {availableYears.map((year) => (
                      <button
                        key={year}
                        type="button"
                        className={`block w-full px-4 py-2 text-left transition hover:bg-white/[0.06] ${
                          year === selectedYear ? "text-white" : "text-white/50"
                        }`}
                        onClick={() => {
                          setSelectedYear(year);
                          setIsYearMenuOpen(false);
                        }}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.1] text-white/60 transition hover:bg-white/[0.05]"
              title="Theme"
              aria-label="Theme"
            >
              <Moon size={16} />
            </button>

            {/* Logout */}
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eee9dc] text-[#303030] transition hover:opacity-80"
              onClick={handleLogout}
              disabled={isLoggingOut}
              title={isLoggingOut ? "Logging out..." : "Logout"}
              aria-label={isLoggingOut ? "Logging out" : "Logout"}
            >
              {isLoggingOut ? (
                <Loader2 size={21} className="animate-spin" />
              ) : (
                <UserCircle size={21} />
              )}
            </button>
          </div>
        </header>

        {/* Hero */}
        <section className="py-8">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {getGreeting()}, Capybara 👋
          </h1>

          <p className="mt-2 text-sm text-white/50">
            Here&apos;s how your badminton is going this year.
          </p>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            const accent = accentStyles[stat.accent];

            return (
              <div
                key={stat.label}
                className="rounded-xl border border-white/[0.1] bg-[#141515] p-5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent.icon}`}
                  >
                    <Icon size={21} />
                  </div>

                  <span className="text-sm text-white/60">{stat.label}</span>
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span
                    className={`text-4xl font-semibold tracking-tight ${
                      showStatsLoading ? "animate-pulse" : ""
                    }`}
                  >
                    {showStatsLoading ? "..." : stat.value}
                  </span>

                  {stat.suffix && !showStatsLoading && (
                    <span className="text-sm text-white/50">{stat.suffix}</span>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400">
                  {stat.label !== "Upcoming" && <TrendingUp size={13} />}
                  {stat.trend}
                </div>
              </div>
            );
          })}
        </section>

        {/* Analytics */}
        <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_315px]">
          {/* Monthly Activity */}
          <div className="rounded-xl border border-white/[0.1] bg-[#141515] p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Monthly Activity</h2>

              <div className="flex rounded-lg border border-white/[0.08] bg-black/20 p-1">
                <button
                  type="button"
                  className={`rounded-md px-4 py-1.5 text-xs transition ${
                    chartMode === "hours" ? "bg-white/[0.08]" : "text-white/40"
                  }`}
                  onClick={() => setChartMode("hours")}
                >
                  Hours
                </button>
                <button
                  type="button"
                  className={`rounded-md px-4 py-1.5 text-xs transition ${
                    chartMode === "matches" ? "bg-white/[0.08]" : "text-white/40"
                  }`}
                  onClick={() => setChartMode("matches")}
                >
                  Matches
                </button>
              </div>
            </div>

            <div className={isMonthlyLoading ? "animate-pulse" : ""}>
              <ActivityChart
                data={monthlyData}
                mode={chartMode}
                selectedYear={selectedYear}
              />
            </div>

            <p className="mt-5 text-xs text-white/40">
              Track your playing time and matches throughout the year.
            </p>
          </div>

          {/* Insights */}
          <div className="rounded-xl border border-white/[0.1] bg-[#141515] p-5">
            <div className="flex items-center gap-2">
              <TrendingUp size={19} className="text-emerald-400" />
              <h2 className="font-semibold">{selectedYear} Insights</h2>
            </div>

            <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
              {strongestMonth ? (
                <div className="flex gap-4">
                  <Star
                    size={23}
                    className="shrink-0 text-yellow-400"
                    fill="currentColor"
                  />

                  <div>
                    <h3 className="text-sm leading-6">
                      {strongestMonth.month}{" "}
                      <span className="font-semibold text-emerald-400">
                        was your strongest month.
                      </span>
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-white/50">
                      You played {strongestMonth.hours} hours across{" "}
                      {strongestMonth.matches} matches.
                    </p>
                  </div>
                </div>
              ) : null}

              {strongestMonth && mostActiveDay && (
                <div className="my-5 h-px bg-white/[0.1]" />
              )}

              {mostActiveDay ? (
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <Clock3 size={16} />
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-emerald-400">
                      Most active day
                    </h3>

                    <p className="mt-1 text-sm text-white/80">
                      {mostActiveDay}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-white/40">
                      You usually play between
                      <br />
                      {typicalStartHour !== null
                        ? formatHourRange(typicalStartHour)
                        : "—"}.
                    </p>
                  </div>
                </div>
              ) : null}

              {!strongestMonth && !mostActiveDay && (
                <div className="flex gap-4">
                  <Star size={23} className="shrink-0 text-white/20" />

                  <div>
                    <h3 className="text-sm leading-6 text-white/60">
                      No data yet.
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-white/40">
                      Play some matches to unlock your insights.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Upcoming Matches */}
        <section className="mt-4 rounded-xl border border-white/[0.1] bg-[#141515] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarDays size={19} className="text-white/50" />
              <h2 className="font-semibold">Upcoming Matches</h2>
            </div>

            <button
              type="button"
              className="rounded-full bg-blue-600 px-5 py-2 text-xs font-medium text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
              onClick={handleNewMatch}
            >
              + New Match
            </button>
          </div>

          {isLoadingFirstPass ? (
            <div className="mt-4 flex min-h-[190px] animate-pulse items-center justify-center rounded-xl border border-dashed border-white/[0.1] bg-black/10 text-xs text-white/40">
              Loading upcoming matches...
            </div>
          ) : upcomingMatches.length === 0 ? (
            <div className="mt-4 flex min-h-[190px] flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.1] bg-black/10 text-center">
              <CalendarDays
                size={44}
                strokeWidth={1.4}
                className="text-white/30"
              />

              <h3 className="mt-4 text-sm font-medium">
                No upcoming matches
              </h3>

              <p className="mt-2 text-xs text-white/40">
                You&apos;re all caught up.
                <br />
                Schedule your next match when you&apos;re ready.
              </p>

              <button
                type="button"
                className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-medium text-white transition hover:bg-blue-500"
                onClick={handleNewMatch}
              >
                + Schedule a match
              </button>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-white/[0.07]">
              {upcomingMatches.map((match) => {
                const [day, month] = formatShortDate(match.date).split(" ");

                return (
                  <div
                    key={match.id}
                    className="grid cursor-pointer grid-cols-1 gap-4 py-4 first:pt-1 last:pb-1 sm:grid-cols-[90px_minmax(0,1fr)_auto] sm:items-center"
                    onClick={() => handleMatchClick(match)}
                  >
                    {/* Date */}
                    <div>
                      <span className="mr-2 text-[10px] text-white/30 sm:block">
                        {month}
                      </span>

                      <span className="text-lg font-medium">{day}</span>
                    </div>

                    {/* Match info */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">
                          {match.title}
                        </span>

                        {closestMatch?.id === match.id && countdown && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.1] bg-white/[0.04] px-2 py-0.5 text-[10px] text-emerald-400">
                            <Clock3 size={11} />
                            {countdown}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 text-xs text-white/40">
                        {match.location}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/50">
                        <span className="flex items-center gap-1.5">
                          <Clock size={12} />
                          {match.time}
                        </span>

                        <span className="flex items-center gap-1.5">
                          <Hash size={12} />
                          Court {match.courtNumber}
                        </span>

                        <span className="flex items-center gap-1.5">
                          <Users size={12} />
                          {match.players?.length || 0} Players
                        </span>

                        {match.players && match.players.length > 0 && (
                          areAllPlayersPaid(match) ? (
                            <span className="text-emerald-400">
                              ✓ All Paid
                            </span>
                          ) : (
                            <span className="text-amber-400/90">
                              {getPendingPaymentCount(match)} Pending
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    {/* More */}
                    <button
                      type="button"
                      className="justify-self-end text-white/40 transition hover:text-white sm:justify-self-auto"
                      onClick={(event) => openRowMenu(event, match)}
                      aria-label={`Actions for ${match.title}`}
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent Matches */}
        <section className="mt-4 rounded-xl border border-white/[0.1] bg-[#141515] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy size={19} className="text-white/50" />
              <h2 className="font-semibold">Recent Matches</h2>
            </div>

            {completedMatches.length > 0 && (
              <button
                type="button"
                className="text-xs text-blue-400 transition hover:text-blue-300"
                onClick={() => setShowAllRecent(!showAllRecent)}
              >
                {showAllRecent ? "Show less" : "View all matches →"}
              </button>
            )}
          </div>

          {isLoadingFirstPass ? (
            <div className="mt-4 flex min-h-[120px] animate-pulse items-center justify-center rounded-xl border border-dashed border-white/[0.1] bg-black/10 text-xs text-white/40">
              Loading recent matches...
            </div>
          ) : completedMatches.length === 0 ? (
            <div className="mt-4 flex min-h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.1] bg-black/10 px-6 text-center">
              <h3 className="text-sm font-medium">No completed matches yet</h3>

              <p className="mt-2 text-xs text-white/40">
                Finish a match to see it here.
              </p>
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.07] bg-black/10">
              {/* Header */}
              <div className="hidden grid-cols-[100px_1fr_180px_150px_30px] border-b border-white/[0.07] px-5 py-3 text-[10px] uppercase tracking-wider text-white/30 sm:grid">
                <span>Date</span>
                <span>Match</span>
                <span>Fee</span>
                <span>Status</span>
                <span />
              </div>

              {recentMatches.map((match) => {
                const [day, month] = formatShortDate(match.date).split(" ");

                return (
                  <div
                    key={match.id}
                    className="grid cursor-pointer grid-cols-1 gap-3 border-b border-white/[0.07] px-5 py-4 last:border-0 sm:grid-cols-[100px_1fr_180px_150px_30px] sm:items-center"
                    onClick={() => handleMatchClick(match)}
                  >
                    {/* Date */}
                    <div>
                      <span className="mr-2 text-[10px] text-white/30 sm:block">
                        {month}
                      </span>

                      <span className="text-lg font-medium">{day}</span>
                    </div>

                    {/* Match */}
                    <div>
                      <div className="text-sm font-medium">{match.title}</div>

                      <div className="mt-1 text-xs text-white/40">
                        {match.location}
                      </div>
                    </div>

                    {/* Fee */}
                    <div>
                      <span className="inline-flex rounded-md border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 font-mono text-xs font-medium">
                        {formatCurrency(match.fee)}
                      </span>
                    </div>

                    {/* Status */}
                    <div>
                      <span className="inline-flex rounded-md bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-400">
                        Completed
                      </span>
                    </div>

                    {/* More */}
                    <button
                      type="button"
                      className="justify-self-end text-white/40 transition hover:text-white sm:justify-self-auto"
                      onClick={(event) => openRowMenu(event, match)}
                      aria-label={`Actions for ${match.title}`}
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="py-8 text-center">
          <div className="text-xs text-white/50">
            © {new Date().getFullYear()} Capybara
          </div>

          <div className="mt-2 text-[10px] text-white/30">
            Badminton Management Dashboard
          </div>
        </footer>
      </div>

      {/* Row action menu */}
      {menu && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeRowMenu} />
          <div
            className="fixed z-50 w-36 overflow-hidden rounded-lg border border-white/[0.1] bg-[#1c1d1d] py-1 text-sm shadow-xl"
            style={{ top: menu.y + 6, left: menu.x }}
          >
            <button
              type="button"
              className="block w-full px-4 py-2 text-left text-white/80 transition hover:bg-white/[0.06]"
              onClick={() => {
                const match = menu.match;
                closeRowMenu();
                handleMatchClick(match);
              }}
            >
              Details
            </button>
            <button
              type="button"
              className="block w-full px-4 py-2 text-left text-white/80 transition hover:bg-white/[0.06]"
              onClick={() => {
                const match = menu.match;
                closeRowMenu();
                handleEditMatch(match);
              }}
            >
              Edit
            </button>
            <button
              type="button"
              className="block w-full px-4 py-2 text-left text-red-400 transition hover:bg-red-400/10"
              onClick={() => {
                const match = menu.match;
                closeRowMenu();
                handleRequestDeleteMatch(match);
              }}
            >
              Delete
            </button>
          </div>
        </>
      )}

      <NewMatchModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitMatch}
        editingMatch={editingMatch}
      />

      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={handleCloseSuccessModal}
        title={successModal.title}
        message={successModal.message}
      />

      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={handleCloseErrorModal}
        title={errorModal.title}
        message={errorModal.message}
      />

      <MatchDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        match={selectedMatch}
        onMatchUpdate={fetchMatches}
      />

      <DeleteMatchModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDeleteMatch}
        matchTitle={matchPendingDeletion?.title || matchPendingDeletion?.location}
        isLoading={isDeletingMatch}
      />
    </main>
  );
}
