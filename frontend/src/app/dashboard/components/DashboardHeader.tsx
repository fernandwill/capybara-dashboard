"use client";

import Image from "next/image";
import { Loader2, LogOut } from "lucide-react";

interface DashboardHeaderProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
  isLoggingOut: boolean;
}

const ThemeIcon = ({ isDarkMode }: { isDarkMode: boolean }) => {
  if (isDarkMode) {
    return (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    );
  }

  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
};

export const DashboardHeader = ({
  isDarkMode,
  onToggleTheme,
  onLogout,
  isLoggingOut,
}: DashboardHeaderProps) => {
  return (
    <header className="header">
      <div className="header-mobile">
        <div className="avatar centered">
          <Image
            src="/icons/icon.jpg"
            alt="logo-icon"
            width={40}
            height={40}
            className="rounded-full"
          />
        </div>
        <h1 className="dashboard-title">Capybara&apos;s Dashboard</h1>
        <div className="header-actions">
          <button className="theme-toggle" onClick={onToggleTheme}>
            <ThemeIcon isDarkMode={isDarkMode} />
          </button>
          <button
            className="logout-button"
            onClick={onLogout}
            disabled={isLoggingOut}
            aria-label={isLoggingOut ? "Logging out" : "Logout"}
            title={isLoggingOut ? "Logging out" : "Logout"}
          >
            {isLoggingOut ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      <div className="header-desktop">
        <div className="header-title">
          <div className="avatar">
            <Image
              src="/icons/icon.jpg"
              alt="logo-icon"
              width={40}
              height={40}
              className="rounded-full"
            />
          </div>
          Capybara&apos;s Dashboard
        </div>
        <div className="header-actions">
          <button className="theme-toggle" onClick={onToggleTheme}>
            <ThemeIcon isDarkMode={isDarkMode} />
          </button>
          <button
            className="logout-button"
            onClick={onLogout}
            disabled={isLoggingOut}
            aria-label={isLoggingOut ? "Logging out" : "Logout"}
            title={isLoggingOut ? "Logging out" : "Logout"}
          >
            {isLoggingOut ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
