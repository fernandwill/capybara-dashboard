import React from "react";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-app-bg text-app-text-primary">
      {/* Header skeleton */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between border-b border-app-border bg-app-bg/85 px-4 pb-0 pt-[env(safe-area-inset-top)] backdrop-blur-md sm:px-6 lg:px-8"
        style={{ height: "calc(4rem + env(safe-area-inset-top))" }}
      >
        <div className="h-9 w-36 rounded-xl bg-app-card animate-pulse border border-app-border" />
        <div className="flex items-center gap-3">
          <div className="h-8 w-20 rounded-xl bg-app-card animate-pulse border border-app-border" />
          <div className="h-8 w-8 rounded-full bg-app-card animate-pulse border border-app-border" />
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex-1 space-y-6 animate-in fade-in-0 duration-150">
        {/* Hero Upcoming Banner Skeleton */}
        <div className="relative overflow-hidden rounded-2xl border border-app-border bg-app-card p-6 animate-pulse">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <div className="h-4 w-28 rounded-full bg-app-input" />
              <div className="h-7 w-64 rounded-lg bg-app-input" />
              <div className="h-4 w-48 rounded-lg bg-app-input" />
            </div>
            <div className="h-11 w-36 rounded-xl bg-app-input" />
          </div>
        </div>

        {/* 3 Stat Cards Skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl border border-app-border bg-app-card p-5 animate-pulse"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="h-4 w-24 rounded bg-app-input" />
                <div className="h-8 w-8 rounded-xl bg-app-input" />
              </div>
              <div className="h-7 w-20 rounded bg-app-input" />
            </div>
          ))}
        </div>

        {/* Upcoming Carousel & Activity Chart Skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 h-80 rounded-2xl border border-app-border bg-app-card p-6 animate-pulse" />
          <div className="lg:col-span-4 h-80 rounded-2xl border border-app-border bg-app-card p-6 animate-pulse" />
        </div>
      </main>

      {/* Footer skeleton */}
      <footer className="w-full border-t border-app-border/40 py-6 text-center text-xs text-app-text-muted">
        <div className="h-4 w-36 mx-auto rounded bg-app-card animate-pulse" />
      </footer>
    </div>
  );
}
