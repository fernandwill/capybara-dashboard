import Image from "next/image";
import { ChevronDown, Loader2, Moon, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
                alt="CapyHub"
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="flex items-center gap-1 text-lg font-bold tracking-tight text-app-text-primary">
              CapyHub
              <span aria-label="Active" className="text-xs text-app-success">
                ✦
              </span>
            </span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Year Selector */}
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                className="gap-3 pl-3 pr-2 font-medium"
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
              </Button>

              {isYearMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={onToggleYearMenu} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-24 overflow-hidden rounded-lg border border-app-border bg-app-card py-1 text-sm shadow-xl">
                    {availableYears.map((year) => (
                      <Button
                        key={year}
                        variant="ghost"
                        role="option"
                        aria-selected={year === selectedYear}
                        className={`h-auto w-full justify-start rounded-none px-4 py-2 font-normal ${
                          year === selectedYear ? "text-white" : "text-app-text-secondary"
                        }`}
                        onClick={() => onSelectYear(year)}
                      >
                        {year}
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full border border-app-border text-app-text-secondary hover:bg-app-card hover:text-app-text-primary"
              title="Theme"
              aria-label="Theme"
            >
              <Moon size={15} />
            </Button>

            {/* User Profile / Logout */}
            <Button
              variant="secondary"
              size="icon"
              className="overflow-hidden rounded-full bg-gray-600 text-app-text-primary hover:bg-gray-500"
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
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
