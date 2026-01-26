"use client";

import { ReactNode } from "react";
import { Button } from "./ui/button";

type StatusVariant = "success" | "error";

const variantConfig: Record<StatusVariant, {
  container: string;
  content: string;
  iconWrapper: string;
  title: string;
  message: string;
  button: string;
  icon: ReactNode;
}> = {
  success: {
    container: "success-modal-container",
    content: "success-modal-content",
    iconWrapper: "success-icon",
    title: "success-title",
    message: "success-message",
    button: "success-btn",
    icon: (
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
    ),
  },
  error: {
    container: "error-modal-container",
    content: "error-modal-content",
    iconWrapper: "error-icon",
    title: "error-title",
    message: "error-message",
    button: "error-btn",
    icon: (
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
    ),
  },
};

export interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  message: ReactNode;
  variant: StatusVariant;
  buttonLabel?: ReactNode;
}

export default function StatusModal({
  isOpen,
  onClose,
  title,
  message,
  variant,
  buttonLabel = "OK",
}: StatusModalProps) {
  if (!isOpen) return null;

  const { container, content, iconWrapper, title: titleClass, message: messageClass, button, icon } =
    variantConfig[variant];

  return (
    <div className="modal-overlay">
      <div className={container}>
        <div className={content}>
          <div className={iconWrapper}>{icon}</div>
          <h2 className={titleClass}>{title}</h2>
          <p className={messageClass}>{message}</p>
          <Button
            variant={variant === "success" ? "success" : "destructive"}
            className={button}
            onClick={onClose}
          >
            {buttonLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
