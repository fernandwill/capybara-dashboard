"use client";

import { Match } from "../types";
import { formatDate, formatTimeWithDuration } from "../utils/matchUtils";

interface UpcomingMatchBannerProps {
  match: Match;
  countdown: string;
}

export const UpcomingMatchBanner = ({ match, countdown }: UpcomingMatchBannerProps) => {
  const closestMatch = match;

  return (
    <div className="upcoming-match-banner">
      <div className="upcoming-match-content">
        <div className="upcoming-match-header">
          <h2 className="upcoming-match-title">UPCOMING MATCH</h2>
          <span className="upcoming-match-date">{formatDate(closestMatch.date)}</span>
        </div>
        <div className="upcoming-match-details">
          <div className="upcoming-match-info">
            <h3 className="match-name">{closestMatch.location}</h3>
            <div className="match-meta">
              <span className="match-time">
                <svg className="h-4 w-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatTimeWithDuration(closestMatch.time)}
              </span>
              <span className="match-court">
                <svg
                  className="h-4 w-4 inline mr-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="4" x2="20" y1="9" y2="9" />
                  <line x1="4" x2="20" y1="15" y2="15" />
                  <line x1="10" x2="8" y1="3" y2="21" />
                  <line x1="16" x2="14" y1="3" y2="21" />
                </svg>
                Court {closestMatch.courtNumber}
              </span>
              <span className="match-players">
                <svg
                  className="h-4 w-4 inline mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Players: {closestMatch.players?.length || 0}
              </span>
            </div>
          </div>
          <div className="upcoming-match-countdown">
            <div className="countdown-display">
              <span className="countdown-label">Time Until Match</span>
              <span className="countdown-timer">{countdown}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
