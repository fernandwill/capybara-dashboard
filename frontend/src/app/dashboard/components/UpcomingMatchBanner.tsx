"use client";

import { Match } from "../types";
import { formatCurrency, formatDate, formatTimeWithDuration } from "../utils/matchUtils";

interface UpcomingMatchBannerProps {
  match: Match;
  countdown: string;
}

export const UpcomingMatchBanner = ({ match, countdown }: UpcomingMatchBannerProps) => {
  return (
    <div className="upcoming-match-banner">
      <div className="upcoming-match-content">
        <div className="upcoming-match-header">
          <h2 className="upcoming-match-title">UPCOMING MATCH</h2>
          <span className="upcoming-match-date">{formatDate(match.date)}</span>
        </div>
        <div className="upcoming-match-details">
          <div className="upcoming-match-info">
            <h3 className="match-name">{match.location}</h3>
            <div className="match-meta">
              <span className="match-time">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {formatTimeWithDuration(match.time)}
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
                Court {match.courtNumber}
              </span>
            </div>
          </div>
          <div className="upcoming-match-meta">
            <div className="match-countdown">
              <span className="countdown-label">Starts in</span>
              <span className="countdown-value">{countdown}</span>
            </div>
            <div className="match-fee">
              <span className="fee-label">Match Fee</span>
              <span className="fee-value">{formatCurrency(match.fee)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
