import Image from "next/image";
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
    <nav className="sticky top-0 z-50 border-b border-app-border bg-app-bg/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-gray-700">
              <Image
                src="/icons/icon.jpg"
                alt="Capybara"
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="flex items-center gap-1 text-lg font-bold tracking-tight text-app-text-primary">
              Capybara
              <span aria-label="Active" className="text-xs text-app-success">
                ✦
              </span>
            </span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Year Selector */}
            <div className="relative">
              <button
                type="button"
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-app-border bg-app-card py-1.5 pl-3 pr-2 text-sm font-medium text-app-text-primary transition focus:outline-none focus:ring-2 focus:ring-app-primary focus:ring-offset-2 focus:ring-offset-app-bg"
                onClick={onToggleYearMenu}
                aria-haspopup="listbox"
                aria-expanded={isYearMenuOpen}
              >
                {selectedYear}
                <ChevronDown
                  size={14}
                  className={`pointer-events-none text-app-text-secondary transition-transform ${
                    isYearMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isYearMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={onToggleYearMenu} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-24 overflow-hidden rounded-lg border border-app-border bg-app-card py-1 text-sm shadow-xl">
                    {availableYears.map((year) => (
                      <button
                        key={year}
                        type="button"
                        role="option"
                        aria-selected={year === selectedYear}
                        className={`block w-full px-4 py-2 text-left transition hover:bg-white/[0.06] ${
                          year === selectedYear ? "text-white" : "text-app-text-secondary"
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

            {/* Theme Toggle */}
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-app-border text-app-text-secondary transition-colors hover:bg-app-card hover:text-app-text-primary"
              title="Theme"
              aria-label="Theme"
            >
              <Moon size={15} />
            </button>

            {/* User Profile / Logout */}
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-app-border bg-gray-600 text-app-text-primary transition hover:bg-gray-500"
              onClick={onLogout}
              disabled={isLoggingOut}
              title={isLoggingOut ? "Logging out..." : "Logout"}
              aria-label={isLoggingOut ? "Logging out" : "Logout"}
            >
              {isLoggingOut ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <UserCircle size={16} />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
