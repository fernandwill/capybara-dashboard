"use client";

import { IconTrash } from "@tabler/icons-react";
import ConfirmModal from "./ConfirmModal";

interface DeleteMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  matchTitle?: string;
  isLoading?: boolean;
}

export default function DeleteMatchModal({
  isOpen,
  onClose,
  onConfirm,
  matchTitle,
  isLoading = false,
}: DeleteMatchModalProps) {
  const message = matchTitle ? (
    <p>
      Are you sure you want to delete <strong className="text-app-text-primary">&ldquo;{matchTitle}&rdquo;</strong>? This action cannot be undone.
    </p>
  ) : (
    <p>Are you sure you want to delete this match? This action cannot be undone.</p>
  );

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Match"
      message={message}
      icon={<IconTrash size={28} />}
      isLoading={isLoading}
      confirmLabel={isLoading ? "Deleting..." : "Delete Match"}
      cancelLabel="Cancel"
      confirmVariant="destructive"
    />
  );
}
