"use client";

import React from "react";
import { Moon } from "lucide-react";
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
  return (
    <div className="min-h-screen bg-[#07090c] text-white">
      {/* Top Header with Floating Left Menu */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#1a1e26] bg-[#07090c]/85 px-4 pb-0 pt-[env(safe-area-inset-top)] backdrop-blur-md sm:px-6 lg:px-8" style={{ height: "calc(4rem + env(safe-area-inset-top))" }}>
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

          {/* Dark Mode Icon */}
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#232730] bg-[#12151c] text-gray-400 transition hover:bg-[#181d26] hover:text-white"
            title="Theme"
            aria-label="Theme"
          >
            <Moon size={14} />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
