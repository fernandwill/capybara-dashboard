'use client';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export default function ErrorModal({ isOpen, onClose, title, message }: ErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="error-modal-container">
        <div className="error-modal-content">
          <div className="error-icon">
            ❌
          </div>
          <h2 className="error-title">{title}</h2>
          <p className="error-message">{message}</p>
          <button className="error-btn" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}