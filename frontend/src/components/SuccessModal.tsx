'use client';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export default function SuccessModal({ isOpen, onClose, title, message }: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="success-modal-container">
        <div className="success-modal-content">
          <div className="success-icon">
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
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22,4 12,14.01 9,11.01"></polyline>
            </svg>
          </div>
          <h2 className="success-title">{title}</h2>
          <p className="success-message">{message}</p>
          <button className="success-btn" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}