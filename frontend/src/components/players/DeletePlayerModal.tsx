"use client";

import React, { useState } from "react";
import Modal from "../ui/Modal";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { authFetch } from "@/lib/authFetch";
import { PlayerRecord } from "./EditPlayerModal";

interface DeletePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerRecord | null;
  onSuccess: () => void;
}

export default function DeletePlayerModal({
  isOpen,
  onClose,
  player,
  onSuccess,
}: DeletePlayerModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!player) return;

    setIsDeleting(true);
    setError("");

    try {
      const res = await authFetch(`/api/players/${player.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete player.");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error("Error deleting player:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete player. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isDeleting ? () => {} : onClose}
      title="Delete Player"
      subtitle=""
      size="sm"
      className="max-w-[380px]"
      footer={
        <div className="flex w-full items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl px-4 py-2 text-xs font-medium text-gray-300 transition hover:bg-gray-800 hover:text-white disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-medium text-white shadow-md transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isDeleting ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={13} />
                <span>Delete Player</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <div className="text-xs text-red-200">
            <p className="font-semibold text-white">Warning: Permanent Action</p>
            <p className="mt-1 text-gray-300">
              Are you sure you want to delete <span className="font-bold text-white">{player?.name}</span>? This will remove their record from the historical player database.
            </p>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-500/10 p-2 text-xs text-red-400 border border-red-500/20">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
