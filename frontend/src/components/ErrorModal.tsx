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
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
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