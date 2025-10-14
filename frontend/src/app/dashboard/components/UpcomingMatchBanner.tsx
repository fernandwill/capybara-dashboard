"use client";

import { Match } from "../types";
import { formatDate, formatTimeWithDuration } from "../utils/matchUtils";

interface UpcomingMatchBannerProps {
  match: Match;
  countdown: string;
}

export const UpcomingMatchBanner = ({ match, countdown }: UpcomingMatchBannerProps) => {
  const matchName = match.title || match.location;
  const playerCount = match.players?.length ?? 0;

  return (
    <div className="upcoming-match-banner">
      <div className="upcoming-match-content">
        <div className="upcoming-match-header">
          <div className="upcoming-match-title">Upcoming Match</div>
          <div className="upcoming-match-meta">
            <span className="upcoming-match-date">{formatDate(match.date)}</span>
            <div className="match-countdown">
              <span className="countdown-label">Time Until Match</span>
              <span className="countdown-value">{countdown}</span>
            </div>
          </div>
        </div>
        <div className="upcoming-match-body">
          <h3 className="match-name">{matchName}</h3>
          {match.location && match.location !== matchName && (
            <div className="match-location">{match.location}</div>
          )}
          <div className="match-meta">
            <div className="match-meta-item">
              <div className="meta-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 7 12 12 15 15" />
                </svg>
              </div>
              <span>{formatTimeWithDuration(match.time)}</span>
            </div>
            <div className="match-meta-item">
              <div className="meta-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="6" x="3" y="3" rx="1" />
                  <rect width="18" height="6" x="3" y="15" rx="1" />
                  <line x1="12" x2="12" y1="9" y2="15" />
                </svg>
              </div>
              <span>Court {match.courtNumber}</span>
            </div>
            <div className="match-meta-item">
              <div className="meta-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0" />
                  <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                </svg>
              </div>
              <span>{playerCount} Players</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
