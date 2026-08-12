import { ChevronDown, Loader2, Moon, UserCircle } from "lucide-react";

interface DashboardHeaderProps {
  selectedYear: number;
  availableYears: number[];
  isYearMenuOpen: boolean;
  isLoggingOut: boolean;
  onToggleYearMenu: () => void;
  onSelectYear: (year: number) => void;
  onLogout: () => void;
}

export default function DashboardHeader({
  selectedYear,
  availableYears,
  isYearMenuOpen,
  isLoggingOut,
  onToggleYearMenu,
  onSelectYear,
  onLogout,
}: DashboardHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-white/[0.08] md:h-[72px]">
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
            onClick={onToggleYearMenu}
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
                onClick={onToggleYearMenu}
              />
              <div className="absolute right-0 top-full z-50 mt-2 w-24 overflow-hidden rounded-lg border border-white/[0.1] bg-[#1c1d1d] py-1 text-sm shadow-xl">
                {availableYears.map((year) => (
                  <button
                    key={year}
                    type="button"
                    className={`block w-full px-4 py-2 text-left transition hover:bg-white/[0.06] ${
                      year === selectedYear ? "text-white" : "text-white/50"
                    }`}
                    onClick={() => onSelectYear(year)}
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
          onClick={onLogout}
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
  );
}
