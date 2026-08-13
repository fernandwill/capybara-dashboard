"use client";

import React from "react";
import { IconCopyright, IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "next-themes";
import FloatingNav from "./FloatingNav";
import CustomDropdown from "@/components/ui/CustomDropdown";

interface AppLayoutProps {
  children: React.ReactNode;
  selectedYear?: number;
  availableYears?: number[];
  onSelectYear?: (year: number) => void;
  onLogout?: () => void;
}

export default function AppLayout({
  children,
  selectedYear = new Date().getFullYear(),
  availableYears = [2024, 2025, 2026],
  onSelectYear,
  onLogout,
}: AppLayoutProps) {
  // Theme cycle: system -> light -> dark -> system. `theme` (not resolved)
  // is the user's explicit choice, so "system" shows the OS-driven mode.
  const { theme, setTheme } = useTheme();
  const current = theme ?? "system";

  const cycleTheme = () => {
    setTheme(current === "system" ? "light" : current === "light" ? "dark" : "system");
  };

  const themeLabel =
    current === "system" ? "System" : current === "light" ? "Light" : "Dark";

  return (
    <div className="min-h-screen flex flex-col justify-between bg-app-bg text-app-text-primary">
      {/* Top Header with Floating Left Menu */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-app-border bg-app-bg/85 px-4 pb-0 pt-[env(safe-area-inset-top)] backdrop-blur-md sm:px-6 lg:px-8" style={{ height: "calc(4rem + env(safe-area-inset-top))" }}>
        {/* Left: Floating Navigation Menu */}
        <div className="flex items-center">
          <FloatingNav onLogout={onLogout} />
        </div>

        {/* Right: Year Selector & Dark Mode Action */}
        <div className="flex items-center gap-3">
          {/* Year Selector */}
          {onSelectYear && (
            <CustomDropdown<number>
              options={availableYears.map((yr) => ({
                value: yr,
                label: String(yr),
              }))}
              value={selectedYear}
              onChange={onSelectYear}
              size="sm"
              align="right"
              className="w-24"
            />
          )}

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={cycleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-app-border bg-app-input text-app-text-muted transition hover:bg-app-hover hover:text-app-text-primary"
            title={`Theme: ${themeLabel}`}
            aria-label={`Theme: ${themeLabel}`}
          >
            {current === "system" ? (
              <IconDeviceDesktop size={14} />
            ) : current === "light" ? (
              <IconSun size={14} />
            ) : (
              <IconMoon size={14} />
            )}
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex-1 animate-in fade-in-0 slide-in-from-bottom-1.5 duration-200 ease-out">
        {children}
      </main>

      {/* App Footer */}
      <footer className="w-full border-t border-app-border/40 py-6 text-center text-xs text-app-text-muted">
        <p className="flex items-center justify-center gap-1.5 font-medium">
          <IconCopyright size={14} className="shrink-0 text-app-text-muted" />
          <span>Capy Club Badmin</span>
        </p>
      </footer>
    </div>
  );
}
