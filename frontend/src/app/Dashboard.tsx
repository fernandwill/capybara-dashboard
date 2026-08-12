"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock3, TrendingUp, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import NewMatchModal from "../components/NewMatchModal";
import SuccessModal from "../components/SuccessModal";
import ErrorModal from "../components/ErrorModal";
import MatchDetailsModal from "../components/MatchDetailsModal";
import DeleteMatchModal from "../components/DeleteMatchModal";
import { signOut } from "@/lib/authService";
import { Match, ModalState } from "@/types/types";
import { formatShortDate } from "@/utils/formatters";
import { sortMatches, getClosestUpcomingMatch } from "@/utils/matchUtils";
import { useStats } from "@/hooks/useStats";
import { useMatches } from "@/hooks/useMatches";
import { useMonthlyStats } from "@/hooks/useMonthlyStats";
import { useCountdown } from "@/hooks/useCountdown";
import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";
import AppLayout from "../components/layout/AppLayout";
import StatCard from "../components/dashboard/StatCard";
import MonthlyActivityCard from "../components/dashboard/MonthlyActivityCard";
import InsightsCard from "../components/dashboard/InsightsCard";
import UpcomingMatchesCard from "../components/dashboard/UpcomingMatchesCard";
import RecentMatchesCard from "../components/dashboard/RecentMatchesCard";
import MatchRowMenu from "../components/dashboard/MatchRowMenu";

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



export function Dashboard() {
  const router = useRouter();
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
  const [isSubmittingMatch, setIsSubmittingMatch] = useState(false);

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
  const recentMatches = completedMatches.slice(0, 5);

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

  const refreshDashboardData = useCallback(() => {
    void fetchStats();
    void fetchMatches();
    void fetchMonthly();
  }, [fetchStats, fetchMatches, fetchMonthly]);

  // Push-based real-time refresh via Supabase Postgres Changes.
  // Any row change in matches/players/match_players/payments triggers a refetch.
  useRealtimeRefresh(refreshDashboardData);

  // Initial data fetch and read-only refresh interval (safety net)
  useEffect(() => {
    refreshDashboardData();

    const intervalId = setInterval(refreshDashboardData, BACKGROUND_REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [refreshDashboardData]);

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
    router.push(`/matches/${match.id}`);
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
    setIsSubmittingMatch(true);
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
    } finally {
      setIsSubmittingMatch(false);
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
      showTrendIcon: false,
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
    <AppLayout
      selectedYear={selectedYear}
      availableYears={availableYears}
      onSelectYear={setSelectedYear}
      onLogout={handleLogout}
    >
      <div className="flex flex-col gap-6">
          {/* Hero */}
          <header>
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-app-text-primary">
              Halo, Admin Magang Capy 👋
            </h1>

            <p className="text-base text-app-text-secondary">
              Here&apos;s how your badminton is going this year.
            </p>
          </header>

          {/* Stats */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                suffix={stat.suffix}
                trend={stat.trend}
                icon={stat.icon}
                accent={stat.accent}
                showTrendIcon={stat.showTrendIcon}
                isLoading={showStatsLoading}
              />
            ))}
          </section>

          {/* Chart & Insights */}
          <section className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
              <MonthlyActivityCard
                data={monthlyData}
                selectedYear={selectedYear}
                isLoading={isMonthlyLoading}
              />
            </div>

            <InsightsCard
              selectedYear={selectedYear}
              strongestMonth={strongestMonth}
              mostActiveDay={mostActiveDay}
              typicalStartHour={typicalStartHour}
            />
          </section>

          {/* Upcoming Matches */}
          <UpcomingMatchesCard
            matches={upcomingMatches}
            closestMatch={closestMatch}
            countdown={countdown}
            isLoading={isLoadingFirstPass}
            onNewMatch={handleNewMatch}
            onMatchClick={handleMatchClick}
            onOpenMenu={openRowMenu}
          />

          {/* Recent Matches */}
          <RecentMatchesCard
            matches={recentMatches}
            totalCount={completedMatches.length}
            isLoading={isLoadingFirstPass}
            onMatchClick={handleMatchClick}
            onOpenMenu={openRowMenu}
          />

          {/* Footer */}
          <footer className="flex flex-col items-center gap-1 pb-2 text-center text-sm text-app-text-muted">
            <p>© {new Date().getFullYear()} Capybara</p>
            <p>Badminton Management Dashboard</p>
          </footer>
        </div>

      {/* Row action menu */}
      <MatchRowMenu
        menu={menu}
        onClose={closeRowMenu}
        onDetails={handleMatchClick}
        onEdit={handleEditMatch}
        onDelete={handleRequestDeleteMatch}
      />

      <NewMatchModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitMatch}
        editingMatch={editingMatch}
        isSubmitting={isSubmittingMatch}
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
        onEdit={(match) => {
          handleCloseDetailsModal();
          handleEditMatch(match);
        }}
      />

      <DeleteMatchModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDeleteMatch}
        matchTitle={matchPendingDeletion?.title || matchPendingDeletion?.location}
        isLoading={isDeletingMatch}
      />
    </AppLayout>
  );
}
