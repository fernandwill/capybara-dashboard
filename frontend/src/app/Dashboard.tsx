"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3, TrendingUp, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import NewMatchModal from "../components/NewMatchModal";
import SuccessModal from "../components/SuccessModal";
import ErrorModal from "../components/ErrorModal";
import DeleteMatchModal from "../components/DeleteMatchModal";
import { signOut } from "@/lib/authService";
import { Match, ModalState } from "@/types/types";
import { sortMatches, getClosestUpcomingMatch } from "@/utils/matchUtils";
import { useStats } from "@/hooks/useStats";
import { useMatches } from "@/hooks/useMatches";
import { useMonthlyStats } from "@/hooks/useMonthlyStats";
import { useCountdown } from "@/hooks/useCountdown";
import { usePlayers } from "@/hooks/usePlayers";
import AppLayout from "../components/layout/AppLayout";
import StatCard from "../components/dashboard/StatCard";
import MonthlyActivityCard from "../components/dashboard/MonthlyActivityCard";
import InsightsCard from "../components/dashboard/InsightsCard";
import UpcomingMatchBanner from "../components/dashboard/UpcomingMatchBanner";
import UpcomingMatchesCard from "../components/dashboard/UpcomingMatchesCard";
import RecentMatchesCard from "../components/dashboard/RecentMatchesCard";
import MatchRowMenu from "../components/dashboard/MatchRowMenu";

// Constants
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

  // Data hooks — all SWR-backed and shared with the other pages via the
  // global cache, so navigating here never refetches what's already loaded.
  const { stats, isLoading: isStatsLoading } = useStats();
  const {
    matches,
    createMatch,
    updateMatch,
    deleteMatch,
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

  // UI state
  const [menu, setMenu] = useState<{ match: Match; x: number; y: number } | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [matchPendingDeletion, setMatchPendingDeletion] = useState<Match | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Loading states
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

  // Matches belonging to the selected year
  const yearMatchesList = useMemo(() => {
    return matches.filter((m) => {
      const d = new Date(m.date);
      return !isNaN(d.getTime()) && d.getFullYear() === selectedYear;
    });
  }, [matches, selectedYear]);

  // 1. Favorite Badminton Centre (most frequent location in selectedYear)
  const favoriteCentre = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of yearMatchesList) {
      const loc = m.location?.trim();
      if (loc) {
        counts.set(loc, (counts.get(loc) || 0) + 1);
      }
    }
    if (counts.size === 0) return null;

    let bestName = "";
    let maxCount = 0;
    counts.forEach((count, loc) => {
      if (count > maxCount) {
        maxCount = count;
        bestName = loc;
      }
    });

    return maxCount > 0 ? { name: bestName, count: maxCount } : null;
  }, [yearMatchesList]);

  // 2. Most Presence (player(s) with highest match attendance in selectedYear)
  const mostPresence = useMemo(() => {
    const counts = new Map<string, { player: { id: string; name: string }; count: number }>();
    for (const m of yearMatchesList) {
      if (!m.players) continue;
      for (const mp of m.players) {
        if (!mp.player) continue;
        const p = mp.player;
        const current = counts.get(p.id) || { player: { id: p.id, name: p.name }, count: 0 };
        current.count += 1;
        counts.set(p.id, current);
      }
    }
    if (counts.size === 0) return null;

    let maxCount = 0;
    counts.forEach((item) => {
      if (item.count > maxCount) {
        maxCount = item.count;
      }
    });

    if (maxCount === 0) return null;

    const topPlayers: { id: string; name: string }[] = [];
    counts.forEach((item) => {
      if (item.count === maxCount) {
        topPlayers.push(item.player);
      }
    });

    return { players: topPlayers, count: maxCount };
  }, [yearMatchesList]);

  // 3. New Blood (number of new players who joined in selectedYear)
  const newBloodCount = useMemo(() => {
    return players.filter((p) => {
      if (!p.createdAt) return false;
      const createdDate = new Date(p.createdAt);
      return !isNaN(createdDate.getTime()) && createdDate.getFullYear() === selectedYear;
    }).length;
  }, [players, selectedYear]);

  // Insights - Activity
  const strongestMonth = useMemo(() => {
    const sorted = [...monthlyData].sort((a, b) => b.hours - a.hours);
    return sorted[0] && sorted[0].hours > 0 ? sorted[0] : null;
  }, [monthlyData]);

  const mostActiveDay = useMemo(() => {
    const counts = new Map<string, number>();
    for (const match of completedMatches) {
      const date = new Date(match.date);
      if (isNaN(date.getTime()) || date.getFullYear() !== selectedYear) continue;
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
  }, [completedMatches, selectedYear]);

  const typicalStartHour = useMemo(() => {
    const counts = new Map<number, number>();
    for (const match of completedMatches) {
      const d = new Date(match.date);
      if (isNaN(d.getTime()) || d.getFullYear() !== selectedYear) continue;
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
  }, [completedMatches, selectedYear]);

  // Force dark theme for the whole app (matches the new design)
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

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

          {/* Upcoming Match Countdown Banner */}
          <UpcomingMatchBanner
            match={closestMatch}
            countdown={countdown}
            isLoading={isLoadingFirstPass}
            onNewMatch={() => setIsModalOpen(true)}
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
