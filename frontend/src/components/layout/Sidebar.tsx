"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "@/lib/authService";

interface SidebarProps {
  className?: string;
  onLogout?: () => void;
}

export default function Sidebar({ className = "", onLogout }: SidebarProps) {
  const pathname = usePathname();
  const { user, setUser } = useAuth();

  const isDashboardActive = pathname === "/" || pathname === "/dashboard";
  const isPlayersActive = pathname === "/players";

  const handleSignOut = async () => {
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

  return (
    <aside
      className={`flex h-screen w-64 flex-col justify-between border-r border-[#1a1e26] bg-[#090b0e] px-4 py-5 text-gray-300 ${className}`}
    >
      {/* Brand & Navigation */}
      <div className="space-y-6">
        {/* Brand Header */}
        <Link href="/" className="flex items-center gap-3 px-2 transition hover:opacity-90">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-gray-700 shadow-sm">
            <Image
              src="/icons/icon.jpg"
              alt="Capybara Logo"
              width={36}
              height={36}
              className="h-full w-full object-cover"
            />
          </div>
          <span className="flex items-center gap-1.5 text-lg font-bold tracking-tight text-white">
            Capybara
            <span aria-label="Active" className="text-xs text-emerald-400">
              ✦
            </span>
          </span>
        </Link>

        {/* Navigation Items (Two menus only) */}
        <nav className="space-y-1.5">
          {/* Dashboard */}
          <Link
            href="/"
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
              isDashboardActive
                ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-semibold"
                : "border border-transparent text-gray-400 hover:bg-[#12151c] hover:text-white"
            }`}
          >
            <LayoutDashboard
              size={18}
              className={isDashboardActive ? "text-emerald-400" : "text-gray-400"}
            />
            <span>Dashboard</span>
          </Link>

          {/* Historical Players List */}
          <Link
            href="/players"
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
              isPlayersActive
                ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-semibold"
                : "border border-transparent text-gray-400 hover:bg-[#12151c] hover:text-white"
            }`}
          >
            <Users
              size={18}
              className={isPlayersActive ? "text-emerald-400" : "text-gray-400"}
            />
            <span>Historical Players List</span>
          </Link>
        </nav>
      </div>

      {/* Profile & Logout Footer */}
      <div className="border-t border-[#1a1e26] pt-4">
        <div className="flex items-center justify-between rounded-xl bg-[#0e1117] p-2.5 border border-[#1a1e26]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-700">
              <Image
                src="/icons/icon.jpg"
                alt="Profile"
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">
                Capybara
              </p>
              <p className="truncate text-[10px] text-gray-400">
                {user?.email || "capybara@gmail.com"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-800 hover:text-red-400"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
