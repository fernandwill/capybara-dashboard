"use client";

import React, { useState } from "react";
import Modal from "../ui/Modal";
import { IconAlertTriangle, IconLoader, IconTrash } from "@tabler/icons-react";
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
            className="rounded-xl px-4 py-2 text-xs font-medium text-app-text-secondary transition hover:bg-app-hover hover:text-app-text-primary disabled:opacity-40"
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
                <IconLoader size={13} className="animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <IconTrash size={13} />
                <span>Delete Player</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
          <IconAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <div className="text-xs text-red-600">
            <p className="font-semibold text-app-text-primary">Warning: Permanent Action</p>
            <p className="mt-1 text-app-text-secondary">
              Are you sure you want to delete <span className="font-bold text-app-text-primary">{player?.name}</span>? This will remove their record from the historical player database.
            </p>
            <p className="mt-1 text-[11px] text-app-text-muted">
              Players with match or payment history cannot be deleted.
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
