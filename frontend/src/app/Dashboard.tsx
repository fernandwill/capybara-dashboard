"use client";

import { useMemo, useState } from "react";
import { IconBolt, IconClock, IconTrendingUp } from "@tabler/icons-react";
import { useAuth } from "@/contexts/AuthContext";
import NewMatchModal from "../components/NewMatchModal";
import MatchDetailsModal from "../components/MatchDetailsModal";
import SuccessModal from "../components/SuccessModal";
import ErrorModal from "../components/ErrorModal";
import DeleteMatchModal from "../components/DeleteMatchModal";
import { signOut } from "@/lib/auth-service";

import { sortMatches, getClosestUpcomingMatch } from "@/utils/match-utils";
import { useStats } from "@/hooks/use-stats";
import { useMatches } from "@/hooks/use-matches";
import { useMatchModals } from "@/hooks/use-match-modals";
import { useMonthlyStats } from "@/hooks/use-monthly-stats";
import { useCountdown } from "@/hooks/use-countdown";
import { usePlayers } from "@/hooks/use-players";
import { useDashboardInsights } from "@/hooks/use-dashboard-insights";
import AppLayout from "../components/layout/AppLayout";
import StatCard from "../components/dashboard/StatCard";
import MonthlyActivityCard from "../components/dashboard/MonthlyActivityCard";
import InsightsCard from "../components/dashboard/InsightsCard";
import UpcomingMatchBanner from "../components/dashboard/UpcomingMatchBanner";
import UpcomingMatchesCard from "../components/dashboard/UpcomingMatchesCard";
import RecentMatchesCard from "../components/dashboard/RecentMatchesCard";
import MatchRowMenu from "../components/dashboard/MatchRowMenu";

export function Dashboard() {
  const { setUser } = useAuth();

  // Data hooks — all SWR-backed and shared with the other pages via the
  // global cache, so navigating here never refetches what's already loaded.
  const { stats, isLoading: isStatsLoading } = useStats();
  const {
    matches,
    createMatch,
    updateMatch,
    deleteMatch,
    updatePlayerPaymentStatus,
    isLoading: isMatchesLoading,
  } = useMatches();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { players } = usePlayers();
  const {
    monthlyData,
    availableYears,
    isLoading: isMonthlyLoading,
    raw: rawMonthly,
  } = useMonthlyStats(selectedYear);

  const {
    editingMatch,
    isModalOpen,
    isDetailsModalOpen,
    matchPendingDeletion,
    isDeleteModalOpen,
    isDeletingMatch,
    isSubmittingMatch,
    menu,
    successModal,
    errorModal,
    activeCompletedMatch,
    handleNewMatch,
    handleEditMatch,
    handleCloseModal,
    handleMatchClick,
    handleCloseDetailsModal,
    handleRequestDeleteMatch,
    handleCloseDeleteModal,
    handleConfirmDeleteMatch,
    handleSubmitMatch,
    openRowMenu,
    closeRowMenu,
    setSuccessModal,
    setErrorModal,
  } = useMatchModals({
    matches,
    createMatch,
    updateMatch,
    deleteMatch,
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

  // Matches belonging to the selected year
  const yearMatchesList = useMemo(() => {
    return matches.filter((m) => {
      const d = new Date(m.date);
      return !isNaN(d.getTime()) && d.getFullYear() === selectedYear;
    });
  }, [matches, selectedYear]);

  // All six insight cards are derived in a dedicated hook.
  const {
    favoriteCentre,
    mostPresence,
    newBloodCount,
    strongestMonth,
    mostActiveDay,
    typicalStartHour,
  } = useDashboardInsights({
    completedMatches,
    yearMatches: yearMatchesList,
    monthlyData,
    players,
    selectedYear,
  });

  // Logout handler
  const handleLogout = async () => {
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
    }
  };

  const handleCloseSuccessModal = () => {
    setSuccessModal({ isOpen: false, title: "", message: "" });
  };

  const handleCloseErrorModal = () => {
    setErrorModal({ isOpen: false, title: "", message: "" });
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
      icon: IconBolt,
      accent: "green" as const,
    },
    {
      label: "Hours Played",
      value: stats.hoursPlayed,
      suffix: "h",
      trend: `${yearHours.toFixed(1)}h in ${selectedYear}`,
      icon: IconClock,
      accent: "blue" as const,
    },
    {
      label: "Avg / Month",
      value: avgHoursPerMonth.toFixed(1),
      suffix: "h",
      trend: `${activeMonths} active months`,
      icon: IconTrendingUp,
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
              ₍ᐢ-(ｪ)-ᐢ₎ Ia ma ia lo, su ma su lo.
            </p>
          </header>

          {/* Upcoming Match Countdown Banner */}
          <UpcomingMatchBanner
            match={closestMatch}
            countdown={countdown}
            isLoading={isLoadingFirstPass}
            onNewMatch={handleNewMatch}
            onMatchClick={handleMatchClick}
          />

          {/* Stats (3 Cards) */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {statCards.map((stat) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                suffix={stat.suffix}
                trend={stat.trend}
                icon={stat.icon}
                accent={stat.accent}
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
              favoriteCentre={favoriteCentre}
              mostPresence={mostPresence}
              newBloodCount={newBloodCount}
              isLoading={isMatchesLoading || isMonthlyLoading}
            />
          </section>

          {/* Upcoming Matches */}
          <UpcomingMatchesCard
            matches={upcomingMatches}
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
        match={activeCompletedMatch}
        onClose={handleCloseDetailsModal}
        onEdit={handleEditMatch}
        onUpdatePaymentStatus={updatePlayerPaymentStatus}
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
