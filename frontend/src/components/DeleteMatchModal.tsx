"use client";
import { X, Trash2 } from "lucide-react";

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
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container delete-modal">
          <button
            className="modal-close delete-modal-close"
            onClick={onClose}
            disabled={isLoading}
          >
            <X />
          </button>
          <div className="delete-modal-content">
            <div className="delete-modal-icon" aria-hidden="true">
              <Trash2 size={72} />
            </div>
            <p className="delete-modal-message">
              Delete
              {matchTitle ? (
                <>
                  {" "}
                  <strong>{matchTitle}</strong>?
                </>
              ) : (
                " this match?"
              )}
            </p>
        </div>
         <div className="delete-modal-actions">
            <button
              type="button"
              className="delete-modal-button delete-modal-button-cancel"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="delete-modal-button delete-modal-button-confirm"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
  );
}


