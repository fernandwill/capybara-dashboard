"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Menu, Moon, UserCircle, X } from "lucide-react";
import Sidebar from "./Sidebar";
import { Button } from "@/components/ui/button";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isYearMenuOpen, setIsYearMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#07090c] text-white">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden lg:flex lg:sticky lg:top-0" onLogout={onLogout} />

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onLogout={onLogout} />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-x-clip">
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#1a1e26] bg-[#07090c]/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          {/* Mobile Menu Toggle & Brand */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-lg border border-[#232730] bg-[#12151c] p-2 text-gray-400 hover:text-white"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-gray-700">
                <Image
                  src="/icons/icon.jpg"
                  alt="Capybara"
                  width={28}
                  height={28}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-sm font-bold text-white">Capybara ✦</span>
            </Link>
          </div>

          <div className="hidden lg:block">
            {/* Desktop spacer */}
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Year Selector */}
            {onSelectYear && (
              <div className="relative">
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2.5 rounded-xl border border-[#232730] bg-[#12151c] pl-3 pr-2.5 font-medium text-xs text-gray-300 hover:text-white hover:bg-[#181d26]"
                  onClick={() => setIsYearMenuOpen(!isYearMenuOpen)}
                  aria-haspopup="listbox"
                  aria-expanded={isYearMenuOpen}
                >
                  <span>{selectedYear}</span>
                  <ChevronDown
                    size={13}
                    className={`text-gray-400 transition-transform ${
                      isYearMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>

                {isYearMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsYearMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-50 mt-2 w-24 overflow-hidden rounded-xl border border-[#232730] bg-[#12151c] py-1 text-xs shadow-2xl">
                      {availableYears.map((year) => (
                        <button
                          key={year}
                          type="button"
                          className={`flex w-full items-center px-3 py-1.5 text-left transition ${
                            year === selectedYear
                              ? "bg-blue-600 text-white font-medium"
                              : "text-gray-400 hover:bg-[#1c222e] hover:text-white"
                          }`}
                          onClick={() => {
                            onSelectYear(year);
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
            )}

            {/* Dark Mode Icon */}
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#232730] bg-[#12151c] text-gray-400 hover:bg-[#181d26] hover:text-white"
              title="Theme"
              aria-label="Theme"
            >
              <Moon size={14} />
            </button>

            {/* User Profile Avatar */}
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-gray-700 bg-gray-800 text-gray-300">
              <Image
                src="/icons/icon.jpg"
                alt="Capybara"
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
