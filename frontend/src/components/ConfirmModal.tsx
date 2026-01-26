"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import clsx from "clsx";
import { Button } from "./ui/button";

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
        <Button
          variant="ghost"
          size="icon"
          className={clsx("modal-close", closeButtonClassName)}
          onClick={handleClose}
          disabled={isLoading}
          aria-label="Close dialog"
        >
          <X />
        </Button>
        <div className={clsx(contentClassName)}>
          {icon && (
            <div className={clsx(iconWrapperClassName)} aria-hidden="true">
              {icon}
            </div>
          )}
          {title && <h2 className={clsx(titleClassName)}>{title}</h2>}
          <div className={clsx(messageClassName)}>{message}</div>
          <div className={clsx(actionsClassName)}>
            <Button
              variant="outline"
              className={clsx(cancelButtonClassName)}
              onClick={handleClose}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
            <Button
              variant="destructive"
              className={clsx(confirmButtonClassName)}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
