"use client";

import { ReactNode } from "react";
import Modal from "./ui/Modal";
import { CheckCircle2, AlertCircle } from "lucide-react";

export type StatusVariant = "success" | "error";

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
  const isSuccess = variant === "success";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={
        <button
          type="button"
          onClick={onClose}
          className={`w-full rounded-lg py-2.5 text-sm font-semibold text-white shadow-sm transition ${
            isSuccess
              ? "bg-emerald-600 hover:bg-emerald-500"
              : "bg-red-600 hover:bg-red-500"
          }`}
        >
          {buttonLabel}
        </button>
      }
    >
      <div className="flex flex-col items-center py-2 text-center">
        <div
          className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border ${
            isSuccess
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              : "border-red-500/20 bg-red-500/10 text-red-400"
          }`}
        >
          {isSuccess ? <CheckCircle2 size={30} /> : <AlertCircle size={30} />}
        </div>
        <h2 className="mb-1.5 text-lg font-bold text-white">{title}</h2>
        <div className="text-sm text-gray-400">{message}</div>
      </div>
    </Modal>
  );
}
