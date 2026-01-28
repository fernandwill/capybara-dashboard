"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import clsx from "clsx";


interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: ReactNode;
  title?: ReactNode;
  icon?: ReactNode;
  isLoading?: boolean;
  confirmLabel?: ReactNode;
  cancelLabel?: ReactNode;
  confirmVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "primary" | "success" | "warning" | "info" | "premium" | "glass";
  overlayClassName?: string;
  containerClassName?: string;
  closeButtonClassName?: string;
  contentClassName?: string;
  iconWrapperClassName?: string;
  titleClassName?: string;
  messageClassName?: string;
  actionsClassName?: string;
  cancelButtonClassName?: string;
  confirmButtonClassName?: string;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  message,
  title,
  icon,
  isLoading = false,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "destructive",
  overlayClassName,
  containerClassName,
  closeButtonClassName,
  contentClassName,
  iconWrapperClassName,
  titleClassName,
  messageClassName,
  actionsClassName,
  cancelButtonClassName,
  confirmButtonClassName,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  return (
    <div className={clsx("modal-overlay", overlayClassName)}>
      <div className={clsx("modal-container", containerClassName)}>
        <button
          type="button"
          className={clsx("modal-close", closeButtonClassName)}
          onClick={handleClose}
          disabled={isLoading}
          aria-label="Close dialog"
        >
          <X />
        </button>
        <div className={clsx(contentClassName)}>
          {icon && (
            <div className={clsx(iconWrapperClassName)} aria-hidden="true">
              {icon}
            </div>
          )}
          {title && <h2 className={clsx(titleClassName)}>{title}</h2>}
          <div className={clsx(messageClassName)}>{message}</div>
          <div className={clsx(actionsClassName)}>
            <button
              type="button"
              className={clsx("btn-outline", cancelButtonClassName)}
              onClick={handleClose}
              disabled={isLoading}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className={clsx(confirmVariant === "success" ? "btn-success" : "btn-primary", confirmButtonClassName)}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
