"use client";

import { Stats } from "../types";

interface StatsOverviewProps {
  stats: Stats;
}

export const StatsOverview = ({ stats }: StatsOverviewProps) => {
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-card-header">
          <span className="stat-card-title">Total Matches</span>
          <svg className="stat-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2zm0-10V5a2 2 0 00-2-2H5a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2zm10 10v-2a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2zm0-10V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2z"
            />
          </svg>
        </div>
        <div className="stat-card-value">{stats.totalMatches}</div>
      </div>

      <div className="stat-card">
        <div className="stat-card-header">
          <span className="stat-card-title">Upcoming Matches</span>
          <svg className="stat-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-3-3v6m8 1V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2z"
            />
          </svg>
        </div>
        <div className="stat-card-value">{stats.upcomingMatches}</div>
      </div>

      <div className="stat-card">
        <div className="stat-card-header">
          <span className="stat-card-title">Completed Matches</span>
          <svg className="stat-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="stat-card-value">{stats.completedMatches}</div>
      </div>

      <div className="stat-card">
        <div className="stat-card-header">
          <span className="stat-card-title">Hours Played</span>
          <svg className="stat-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="stat-card-value">{stats.hoursPlayed}</div>
      </div>
    </div>
  );
};
