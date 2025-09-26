"use client";

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
      <div className="modal-container">
        <div className="modal-header">
          <h2>Delete Match</h2>
          <button
            className="modal-close"
            onClick={onClose}
            disabled={isLoading}
          >
            ×
          </button>
        </div>
        <div className="modal-form">
          <p>
            Are you sure you want to delete
            {matchTitle ? (
              <>
                {" "}
                <strong>{matchTitle}</strong>?
              </>
            ) : (
              " this match?"
            )}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            This action cannot be undone and will remove all associated data.
          </p>
        </div>
        <div className="modal-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="delete-btn"
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
