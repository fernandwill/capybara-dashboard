"use client";

import { Trash2 } from "lucide-react";
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
      Delete {" "}
      <strong>{matchTitle}</strong>?
    </p>
  ) : (
    <p>Delete this match?</p>
  );

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      message={message}
      icon={<Trash2 size={72} />}
      isLoading={isLoading}
      confirmLabel={isLoading ? "Deleting..." : "Delete"}
      cancelLabel="Cancel"
      containerClassName="delete-modal"
      closeButtonClassName="delete-modal-close"
      contentClassName="delete-modal-content"
      iconWrapperClassName="delete-modal-icon"
      messageClassName="delete-modal-message"
      actionsClassName="delete-modal-actions"
      cancelButtonClassName="delete-modal-button delete-modal-button-cancel"
      confirmButtonClassName="delete-modal-button delete-modal-button-confirm"
    />
  );
}
