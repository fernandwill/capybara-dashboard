"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  IconCalendar,
  IconCheck,
  IconClock,
  IconEdit,
  IconHash,
  IconLoader,
  IconMapPin,
  IconReceipt,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import Modal from "./ui/Modal";
import { Match, MatchPlayer } from "@/types/types";
import { formatCurrency, formatDate, formatTimeWithDuration } from "@/utils/formatters";

interface MatchDetailsModalProps {
  isOpen: boolean;
  match: Match | null;
  onClose: () => void;
  onEdit?: (match: Match) => void;
  onUpdatePaymentStatus?: (
    matchId: string,
    playerId: string,
    paymentStatus: "BELUM_SETOR" | "SUDAH_SETOR"
  ) => Promise<boolean>;
}

export default function MatchDetailsModal({
  isOpen,
  match,
  onClose,
  onEdit,
  onUpdatePaymentStatus,
}: MatchDetailsModalProps) {
  const [updatingPlayerId, setUpdatingPlayerId] = useState<string | null>(null);
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);

  const players: MatchPlayer[] = match?.players || [];
  const paidPlayersCount = players.filter(
    (p) => p.paymentStatus === "SUDAH_SETOR"
  ).length;
  const totalPlayersCount = players.length;
  const isAllPaid = totalPlayersCount > 0 && paidPlayersCount === totalPlayersCount;
  const feePerPlayer =
    match && totalPlayersCount > 0
      ? Math.round(match.fee / totalPlayersCount)
      : (match?.fee ?? 0);

  const handleTogglePayment = async (playerId: string, currentStatus: string) => {
    if (!match || !onUpdatePaymentStatus || updatingPlayerId || isUpdatingAll) return;

    const nextStatus =
      currentStatus === "SUDAH_SETOR" ? "BELUM_SETOR" : "SUDAH_SETOR";
    setUpdatingPlayerId(playerId);

    try {
      await onUpdatePaymentStatus(match.id, playerId, nextStatus);
    } catch (err) {
      console.error("Failed to toggle payment status:", err);
    } finally {
      setUpdatingPlayerId(null);
    }
  };

  const handleMarkAllPaid = useCallback(async () => {
    if (!match || !onUpdatePaymentStatus || isUpdatingAll) return;
    const unpaidPlayers = (match.players || []).filter(
      (p) => p.paymentStatus !== "SUDAH_SETOR"
    );
    if (unpaidPlayers.length === 0) return;

    setIsUpdatingAll(true);
    try {
      await Promise.all(
        unpaidPlayers.map((p) =>
          onUpdatePaymentStatus(match.id, p.player.id, "SUDAH_SETOR")
        )
      );
    } catch (err) {
      console.error("Failed to mark all as paid:", err);
    } finally {
      setIsUpdatingAll(false);
    }
  }, [match, onUpdatePaymentStatus, isUpdatingAll]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cheat shortcuts: Shift + P, or Alt + P, or Ctrl + Shift + P
      if (
        e.key.toLowerCase() === "p" &&
        (e.shiftKey || e.altKey || (e.ctrlKey && e.shiftKey))
      ) {
        e.preventDefault();
        handleMarkAllPaid();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleMarkAllPaid]);

  if (!match) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={match.title}
      subtitle="Completed match summary & player payment status"
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="text-xs text-app-text-muted">
            <span className="font-semibold text-app-text-primary">
              {paidPlayersCount}/{totalPlayersCount}
            </span>{" "}
            players paid
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(match);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-app-border bg-app-input px-3.5 py-2 text-xs font-semibold text-app-text-secondary transition hover:bg-app-hover hover:text-app-text-primary"
              >
                <IconEdit size={14} />
                <span>Edit Match</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-app-primary px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-app-primary-hover"
            >
              Close
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Section: MATCH DETAILS */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-app-text-muted">
              MATCH DETAILS
            </h3>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
              Completed
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {/* Location */}
            <div className="flex items-center gap-3 rounded-xl border border-app-border bg-app-input px-3.5 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400">
                <IconMapPin size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-app-text-muted">
                  Location
                </p>
                <p className="truncate text-xs font-semibold text-app-text-primary">
                  {match.location || "Court location not set"}
                </p>
              </div>
            </div>

            {/* Court # */}
            <div className="flex items-center gap-3 rounded-xl border border-app-border bg-app-input px-3.5 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400">
                <IconHash size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-app-text-muted">
                  Court
                </p>
                <p className="text-xs font-semibold text-app-text-primary">
                  Court {match.courtNumber || "1"}
                </p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-3 rounded-xl border border-app-border bg-app-input px-3.5 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-400">
                <IconCalendar size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-app-text-muted">
                  Date
                </p>
                <p className="truncate text-xs font-semibold text-app-text-primary">
                  {formatDate(match.date)}
                </p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-center gap-3 rounded-xl border border-app-border bg-app-input px-3.5 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                <IconClock size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-app-text-muted">
                  Time
                </p>
                <p className="truncate text-xs font-semibold text-app-text-primary">
                  {formatTimeWithDuration(match.time)}
                </p>
              </div>
            </div>
          </div>

          {/* Fee Summary */}
          <div className="mt-2.5 flex items-center justify-between rounded-xl border border-app-border bg-app-input px-3.5 py-2.5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                <IconReceipt size={16} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-app-text-muted">
                  Total Court Fee
                </p>
                <p className="text-xs font-bold text-emerald-400">
                  {formatCurrency(match.fee)}
                </p>
              </div>
            </div>
            {totalPlayersCount > 0 && (
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-app-text-muted">
                  Per Player Share
                </p>
                <p className="text-xs font-semibold text-app-text-secondary">
                  {formatCurrency(feePerPlayer)} / player
                </p>
              </div>
            )}
          </div>

          {/* Description if present */}
          {match.description && (
            <div className="mt-2.5 rounded-xl border border-app-border bg-app-input p-3 text-xs text-app-text-secondary">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-app-text-muted">
                Description
              </p>
              <p className="whitespace-pre-line">{match.description}</p>
            </div>
          )}
        </div>

        {/* Section: PLAYERS & PAYMENT STATUS */}
        <div>
          <div className="mb-3.5 space-y-2">
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-app-text-muted">
                PLAYERS & PAYMENT ({totalPlayersCount})
              </h3>
              <p className="text-xs text-app-text-muted">
                Click a status badge to toggle payment status, from "Sudah Setor" to "Belum Setor" and vice versa.
              </p>
            </div>
            {totalPlayersCount > 0 && (
              <div className="flex justify-center pt-0.5">
                {isAllPaid ? (
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                    <IconCheck size={14} />
                    <span>Senang Bertepok dengan Anda</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleMarkAllPaid}
                    disabled={isUpdatingAll || Boolean(updatingPlayerId)}
                    title="Cheat: Click (or press Shift+P) to mark all as paid"
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 transition hover:border-amber-500/40 hover:bg-amber-500/20 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                  >
                    {isUpdatingAll ? (
                      <>
                        <IconLoader size={13} className="animate-spin" />
                        <span>Updating all...</span>
                      </>
                    ) : (
                      <span>
                        {totalPlayersCount - paidPlayersCount} Orang Belum Setor
                      </span>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {players.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-app-border bg-app-input/60 p-6 text-center text-xs text-app-text-muted">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-400">
                <IconUsers size={18} />
              </div>
              <p className="font-semibold text-app-text-primary">No players in this match</p>
              <p className="mt-0.5">No roster recorded for this session.</p>
            </div>
          ) : (
            /* 2x2 Grid of Players */
            <div className="grid grid-cols-2 gap-2.5">
              {players.map(({ player, paymentStatus }) => {
                const isPaid = paymentStatus === "SUDAH_SETOR";
                const isUpdating = updatingPlayerId === player.id;

                return (
                  <div
                    key={player.id}
                    className={`flex flex-col justify-between gap-2 rounded-xl border p-2.5 transition-all ${
                      isPaid
                        ? "border-emerald-500/30 bg-emerald-500/[0.04]"
                        : "border-amber-500/30 bg-amber-500/[0.04]"
                    }`}
                  >
                    {/* Player Info */}
                    <div className="flex items-center gap-2 min-w-0">
                      <Image
                        src="/capybara-avatar.png"
                        alt={player.name}
                        width={400}
                        height={383}
                        className="h-7 w-7 shrink-0 rounded-full object-cover border border-app-border shadow-sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-app-text-primary">
                          {player.name}
                        </p>
                        <p className="text-[10px] text-app-text-muted">
                          {formatCurrency(feePerPlayer)}
                        </p>
                      </div>
                    </div>

                    {/* Payment Toggle Button */}
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleTogglePayment(player.id, paymentStatus)}
                      className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 text-[11px] font-bold tracking-wide transition-all shadow-sm active:scale-[0.98] disabled:opacity-60 ${
                        isPaid
                          ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                          : "border border-amber-500/40 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
                      }`}
                      title={`Click to change to ${isPaid ? "BELUM SETOR" : "SUDAH SETOR"}`}
                    >
                      {isUpdating ? (
                        <IconLoader size={13} className="animate-spin" />
                      ) : isPaid ? (
                        <>
                          <IconCheck size={13} strokeWidth={2.5} />
                          <span>SUDAH SETOR</span>
                        </>
                      ) : (
                        <>
                          <IconClock size={13} strokeWidth={2.5} />
                          <span>BELUM SETOR</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
