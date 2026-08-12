"use client";

import React, { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import { Loader2 } from "lucide-react";
import { authFetch } from "@/lib/authFetch";

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

  useEffect(() => {
    if (player && isOpen) {
      setName(player.name || "");
      setStatus(player.status || "ACTIVE");
      setNotes(player.notes || "");
      setError("");
      setIsSubmitting(false);
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
            className="rounded-xl px-4 py-2 text-xs font-medium text-gray-300 transition hover:bg-gray-800 hover:text-white disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-medium text-white shadow-md transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
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
          <label className="mb-1.5 block text-xs font-semibold text-gray-300">
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
            className="w-full rounded-xl border border-[#232730] bg-[#0c0e12] px-3.5 py-2.5 text-xs text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Notes (optional) */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-gray-300">
            <span>Notes <span className="font-normal text-gray-500">(optional)</span></span>
            <span className="text-[11px] font-normal text-gray-500">
              {notes.length}/200
            </span>
          </div>
          <textarea
            rows={4}
            maxLength={200}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this player..."
            className="w-full resize-none rounded-xl border border-[#232730] bg-[#0c0e12] p-3 text-xs text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
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
