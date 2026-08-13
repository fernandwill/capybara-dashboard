"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconLayoutDashboard,
  IconCalendarEvent,
  IconUsers,
  IconLogout,
  IconChevronDown,
  IconSparkles,
} from "@tabler/icons-react";
import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "@/lib/auth-service";

interface FloatingNavProps {
  onLogout?: () => void;
}

export default function FloatingNav({ onLogout }: FloatingNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 72, left: 24 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { user, setUser } = useAuth();

  const isDashboardActive = pathname === "/" || pathname === "/dashboard";
  const isMatchesActive = pathname === "/matches" || pathname.startsWith("/matches/");
  const isPlayersActive = pathname === "/players";

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 10,
        left: Math.max(16, rect.left),
      });
    }
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen((prev) => !prev);
  };

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("resize", updatePosition);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition]);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    setIsOpen(false);
    if (onLogout) {
      onLogout();
      return;
    }
    try {
      await signOut();
      setUser(null);
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const navItems = [
    {
      href: "/",
      label: "Dashboard",
      icon: IconLayoutDashboard,
      description: "Overview & Analytics",
      isActive: isDashboardActive,
    },
    {
      href: "/matches",
      label: "Matches",
      icon: IconCalendarEvent,
      description: "All Match Records",
      isActive: isMatchesActive,
    },
    {
      href: "/players",
      label: "Historical Players List",
      icon: IconUsers,
      description: "Player Directory & Stats",
      isActive: isPlayersActive,
    },
  ];

  return (
    <>
      {/* Floating Trigger Button with App Icon */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={`group relative flex items-center gap-2.5 rounded-full border border-app-border bg-app-input/90 py-1.5 pl-1.5 pr-3.5 shadow-lg backdrop-blur-md transition-all duration-200 hover:border-yellow-500/40 hover:bg-app-hover active:scale-95 ${
          isOpen
            ? "border-yellow-500/50 bg-app-hover ring-2 ring-yellow-500/20"
            : ""
        }`}
        title="Open Navigation Menu"
      >
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-app-border shadow-sm transition-transform duration-200 group-hover:scale-105">
          <Image
            src="/icons/icon.jpg"
            alt="CapyHub"
            width={32}
            height={32}
            className="h-full w-full object-cover"
          />
        </div>
        <span className="flex items-center gap-1.5 text-sm font-bold tracking-tight text-app-text-primary">
          CapyHub
          <span className="text-xs text-yellow-400">✦</span>
        </span>
        <IconChevronDown
          size={14}
          className={`text-app-text-muted transition-transform duration-200 ${
            isOpen ? "rotate-180 text-yellow-400" : "group-hover:text-app-text-primary"
          }`}
        />
      </button>

      {/* Portalled Fullscreen Blur Backdrop and Floating Popover */}
      {isOpen &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-50">
            {/* Fullscreen Backdrop blurring the ENTIRE webpage */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-200 animate-in fade-in"
              onClick={() => setIsOpen(false)}
            />

            {/* Floating Dropdown Menu Card */}
            <div
              ref={menuRef}
              style={{
                top: `${menuPos.top}px`,
                left: `${menuPos.left}px`,
              }}
              className="fixed w-72 origin-top-left rounded-2xl border border-app-border bg-app-bg/95 p-3 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 z-50"
            >
              {/* Header Badge */}
              <div className="mb-2.5 flex items-center justify-between px-2 pt-1">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md border border-yellow-500/30 bg-yellow-500/10 text-yellow-400">
                    <IconSparkles size={13} />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-app-text-muted">
                    Navigation
                  </span>
                </div>
                <span className="rounded-md border border-app-border bg-app-input px-2 py-0.5 text-[10px] font-medium text-yellow-400">
                  Menu
                </span>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                        item.isActive
                          ? "border border-yellow-500/20 bg-yellow-500/10 text-yellow-400 font-semibold"
                          : "border border-transparent text-app-text-secondary hover:bg-app-hover hover:text-app-text-primary"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                          item.isActive
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-app-input text-app-text-muted group-hover:bg-app-hover group-hover:text-app-text-primary"
                        }`}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold leading-tight text-app-text-primary">
                          {item.label}
                        </div>
                        <div className="text-[10px] text-app-text-muted group-hover:text-app-text-secondary">
                          {item.description}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </nav>

              {/* Divider */}
              <div className="my-2.5 border-t border-app-border/80" />

              {/* Profile & Logout */}
              <div className="flex items-center justify-between rounded-xl border border-app-border bg-app-input p-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-app-border">
                    <Image
                      src="/capybara-avatar.png"
                      alt="CapyHub"
                      width={32}
                      height={32}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-app-text-primary leading-tight">
                      Admin Capy
                    </p>
                    <p className="truncate text-[10px] text-app-text-muted">
                      {user?.email || "capybara@gmail.com"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-app-text-muted transition hover:bg-rose-500/10 hover:text-rose-400"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <IconLogout size={14} />
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
