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
            ✅
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