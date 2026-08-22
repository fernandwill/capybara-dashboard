"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { IconChevronDown, IconCheck } from "@tabler/icons-react";

export interface DropdownOption<T extends string | number = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface CustomDropdownProps<T extends string | number = string> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  align?: "left" | "right";
  ariaLabel?: string;
}

export default function CustomDropdown<T extends string | number = string>({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  className = "",
  triggerClassName = "",
  menuClassName = "",
  disabled = false,
  size = "md",
  icon,
  align = "left",
  ariaLabel,
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        event.target instanceof Node &&
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (e.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (!isOpen && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
        e.preventDefault();
        setIsOpen(true);
        const currentIndex = options.findIndex((opt) => opt.value === value);
        setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
        return;
      }

      if (isOpen) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < options.length) {
            const opt = options[focusedIndex];
            if (!opt.disabled) {
              onChange(opt.value);
              setIsOpen(false);
            }
          }
        }
      }
    },
    [disabled, isOpen, options, value, focusedIndex, onChange]
  );

  const sizeClasses = {
    sm: "px-2.5 py-1.5 text-xs gap-1.5 rounded-lg",
    md: "px-3.5 py-2 text-sm gap-2 rounded-xl",
    lg: "px-4 py-2.5 text-base gap-2.5 rounded-xl",
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || placeholder}
        className={`flex w-full items-center justify-between border border-app-border bg-app-input font-medium text-app-text-primary transition-all duration-150 hover:border-app-border-hover hover:bg-app-hover focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary disabled:cursor-not-allowed disabled:opacity-50 ${
          sizeClasses[size]
        } ${triggerClassName}`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="shrink-0 text-app-text-muted">{icon}</span>}
          {selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              {selectedOption.icon && (
                <span className="shrink-0">{selectedOption.icon}</span>
              )}
              <span className="truncate text-app-text-primary">{selectedOption.label}</span>
            </div>
          ) : (
            <span className="text-app-text-muted">{placeholder}</span>
          )}
        </div>

        <IconChevronDown
          size={size === "sm" ? 13 : 15}
          className={`shrink-0 text-app-text-muted transition-transform duration-200 ${
            isOpen ? "rotate-180 text-app-primary" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div
          role="listbox"
          className={`custom-scrollbar absolute z-50 mt-1.5 max-h-64 min-w-full overflow-y-auto rounded-xl border border-app-border bg-app-input/95 p-1.5 shadow-2xl backdrop-blur-md transition-all duration-150 animate-in fade-in zoom-in-95 ${
            align === "right" ? "right-0" : "left-0"
          } ${menuClassName}`}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isFocused = index === focusedIndex;

            return (
              <button
                key={String(option.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                onClick={() => {
                  if (!option.disabled) {
                    onChange(option.value);
                    setIsOpen(false);
                  }
                }}
                onMouseEnter={() => setFocusedIndex(index)}
                className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-all ${
                  size === "sm" ? "text-xs" : "text-sm"
                } ${
                  isSelected
                    ? "bg-app-primary/15 text-app-primary font-semibold"
                    : isFocused
                    ? "bg-app-selected text-app-text-primary"
                    : "text-app-text-secondary hover:bg-app-hover hover:text-app-text-primary"
                } ${option.disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  {option.icon && (
                    <span className="shrink-0 text-app-text-muted group-hover:text-app-text-primary">
                      {option.icon}
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="truncate font-medium">{option.label}</div>
                    {option.description && (
                      <div className="truncate text-[11px] text-app-text-muted">
                        {option.description}
                      </div>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <IconCheck
                    size={size === "sm" ? 13 : 15}
                    className="shrink-0 text-app-primary ml-2"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
