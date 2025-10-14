"use client";

import { Trash2 } from "lucide-react";

import { Match } from "../types";
import {
  areAllPlayersPaid,
  formatCurrency,
  formatDate,
  formatTimeWithDuration,
  getPendingPaymentCount,
} from "../utils/matchUtils";

interface MatchesListProps {
  matches: Match[];
  onSelect: (match: Match) => void;
  onEdit: (match: Match) => void;
  onDelete: (match: Match) => void;
}

export const MatchesList = ({ matches, onSelect, onEdit, onDelete }: MatchesListProps) => {
  if (matches.length === 0) {
    return null;
  }

  return (
    <div className="matches-list">
      {matches.map((match) => {
        const pendingCount = getPendingPaymentCount(match);
        const allPlayersPaid = areAllPlayersPaid(match);

        return (
          <div
            key={match.id}
            className="match-card clickable-card"
            onClick={() => onSelect(match)}
            style={{ position: "relative" }}
          >
            <div className="match-status-top">
              <span className={`status-badge ${match.status.toLowerCase()}`}>
                {match.status}
              </span>
            </div>
            <button
              className="delete-btn"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(match);
              }}
              title="Delete match"
              style={{ position: "absolute", top: "16px", right: "56px", zIndex: 10 }}
            >
              <Trash2 size={16} />
            </button>
            <button
              className="edit-btn"
              onClick={(event) => {
                event.stopPropagation();
                onEdit(match);
              }}
              title="Edit match"
              style={{ position: "absolute", top: "16px", right: "16px", zIndex: 10 }}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <div className="match-header">
              <h3 className="match-title">
                {match.location} - {formatDate(match.date)}
              </h3>
            </div>
            <div className="match-details">
              <div className="match-info">
                <span className="match-time">
                  <svg className="h-4 w-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="h-4 w-4"
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
                <span className="match-players">
                  <svg className="h-4 w-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  Players: {match.players?.length || 0}
                </span>
              </div>
            </div>
            {match.description && <div className="match-description">{match.description}</div>}
            <div className="match-bottom">
              <div className="match-price">
                <div className="fee-section">
                  <span className={`match-fee ${allPlayersPaid ? "fee-paid" : "fee-unpaid"}`}>
                    {formatCurrency(match.fee)}
                  </span>
                  {pendingCount > 0 && (
                    <span className="pending-payment">
                      Pending payment: {pendingCount} player
                      {pendingCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
