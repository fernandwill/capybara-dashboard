"use client";

import { ReactNode } from "react";
import Modal from "./ui/Modal";
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
  confirmVariant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "primary"
    | "success"
    | "warning"
    | "info"
    | "premium"
    | "glass";
  containerClassName?: string;
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
  containerClassName = "",
}: ConfirmModalProps) {
  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="md"
      className={containerClassName}
      footer={
        <>
          <button
            type="button"
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-800 hover:text-white disabled:opacity-50"
            onClick={handleClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <Button
            variant={
              confirmVariant === "success"
                ? "success"
                : confirmVariant === "destructive"
                  ? "destructive"
                  : "primary"
            }
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-lg px-5 py-2 text-sm font-medium transition"
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center py-2 text-center">
        {icon && (
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
            {icon}
          </div>
        )}
        <div className="text-sm leading-relaxed text-gray-300">{message}</div>
      </div>
    </Modal>
  );
}
