"use client";

import React, { useEffect, useRef, useState } from "react";
import Modal from "../ui/Modal";
import { IconLoader } from "@tabler/icons-react";
import { authFetch } from "@/lib/auth-fetch";

export interface PlayerRecord {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  playCount?: number;
  totalMatches?: number;
  thisYearMatches?: number;
  lastPlayed?: string | null;
}

interface EditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerRecord | null;
  onSuccess: () => void;
}

export default function EditPlayerModal({
  isOpen,
  onClose,
  player,
  onSuccess,
}: EditPlayerModalProps) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submittingRef = useRef(false);

  // Keep the ref in sync so a fast double-click/Enter can't fire two submits
  useEffect(() => {
    submittingRef.current = isSubmitting;
  }, [isSubmitting]);

  useEffect(() => {
    if (player && isOpen) {
      setName(player.name || "");
      setStatus(player.status || "ACTIVE");
      setNotes(player.notes || "");
      setError("");
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  }, [player, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Player name is required.");
      return;
    }

    // Prevent duplicate submissions while a request is in flight (guards the
    // same-tick window before the disabled state lands)
    if (submittingRef.current) return;
    submittingRef.current = true;

    setIsSubmitting(true);
    setError("");

    try {
      const res = await authFetch(`/api/players/${player.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          notes: notes.trim() || null,
          status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update player.");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to update player. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title="Edit Player"
      subtitle=""
      size="md"
      className="max-w-[420px]"
      footer={
        <div className="flex w-full items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl px-4 py-2 text-xs font-medium text-app-text-secondary transition hover:bg-app-hover hover:text-app-text-primary disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-app-primary px-5 py-2 text-xs font-medium text-white shadow-md transition hover:bg-app-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? (
              <>
                <IconLoader size={14} className="animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-app-text-secondary">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="e.g. Yocelyn"
            required
            className="w-full rounded-xl border border-app-border bg-app-input px-3.5 py-2.5 text-xs text-app-text-primary placeholder:text-app-text-muted focus:border-app-primary focus:outline-none transition-colors"
          />
        </div>

        {/* Notes (optional) */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-app-text-secondary">
            <span>Notes <span className="font-normal text-app-text-muted">(optional)</span></span>
            <span className="text-[11px] font-normal text-app-text-muted">
              {notes.length}/200
            </span>
          </div>
          <textarea
            rows={4}
            maxLength={200}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this player..."
            className="w-full resize-none rounded-xl border border-app-border bg-app-input p-3 text-xs text-app-text-primary placeholder:text-app-text-muted focus:border-app-primary focus:outline-none transition-colors"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-500/10 p-2 text-xs text-red-400 border border-red-500/20">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
