"use client";

import React, { useEffect, useRef } from "react";
import { IconX } from "@tabler/icons-react";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

const SIZE_MAP = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
} satisfies Record<ModalSize, string>;

function isText(value: React.ReactNode): value is string {
  return typeof value === "string";
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEsc?: boolean;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  ariaLabel?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  size = "xl",
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEsc = true,
  className = "",
  bodyClassName = "",
  headerClassName = "",
  footerClassName = "",
  ariaLabel,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Save the trigger's focus and move it into the dialog when it opens.
  useEffect(() => {
    if (!isOpen) return;

    // SAFETY: the element focused when the modal opened is the trigger
    // control (an HTML button/link), so focus() below is available on it.
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const raf = requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });

    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

  // Trap Tab focus inside the dialog so keyboard users can't reach the page
  // behind it.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Return focus to the element that opened the dialog when it closes.
  useEffect(() => {
    if (isOpen) return;
    previouslyFocusedRef.current?.focus?.();
    previouslyFocusedRef.current = null;
  }, [isOpen]);

  // ESC key handler
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeOnEsc, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClass = SIZE_MAP[size] || "max-w-xl";

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      aria-label={isText(title) ? title : ariaLabel || "Modal"}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 sm:p-6 backdrop-blur-sm transition-opacity outline-none animate-in fade-in duration-150"
      onClick={(e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`relative flex h-auto max-h-[90dvh] sm:max-h-[85vh] w-full ${maxWidthClass} flex-col rounded-2xl border border-app-border bg-app-card p-5 sm:p-6 shadow-2xl text-app-text-primary transition-all animate-in zoom-in-95 duration-200 ${className}`}
      >
        {/* Modal Header */}
        {(title || icon || showCloseButton) && (
          <div
            className={`mb-5 flex items-start justify-between gap-4 ${headerClassName}`}
          >
            <div className="flex items-center gap-3">
              {icon && <div className="shrink-0">{icon}</div>}
              <div>
                {title && (
                  <h2 className="text-xl font-bold tracking-tight text-app-text-primary">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="mt-0.5 text-xs text-app-text-muted">{subtitle}</p>
                )}
              </div>
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="shrink-0 rounded-lg p-1.5 text-app-text-muted transition hover:bg-app-hover hover:text-app-text-primary"
              >
                <IconX size={18} />
              </button>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className={`flex-1 overflow-y-auto pr-1 ${bodyClassName}`}>
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div
            className={`mt-5 flex items-center justify-end gap-3 border-t border-app-border pt-4 ${footerClassName}`}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
