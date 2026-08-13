import React from "react";

export default function MatchDetailsLoading() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-app-bg text-app-text-primary">
      {/* Top Header skeleton */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between border-b border-app-border bg-app-bg/85 px-4 pb-0 pt-[env(safe-area-inset-top)] backdrop-blur-md sm:px-6 lg:px-8"
        style={{ height: "calc(4rem + env(safe-area-inset-top))" }}
      >
        <div className="h-9 w-36 rounded-xl bg-app-card animate-pulse border border-app-border" />
        <div className="h-8 w-8 rounded-full bg-app-card animate-pulse border border-app-border" />
      </header>

      <main className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex-1 space-y-6 animate-in fade-in-0 duration-150">
        {/* Back Link & Match Info Header Skeleton */}
        <div className="space-y-3">
          <div className="h-4 w-28 rounded bg-app-card animate-pulse" />
          <div className="rounded-2xl border border-app-border bg-app-card p-6 animate-pulse">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2.5">
                <div className="h-4 w-20 rounded-full bg-app-input" />
                <div className="h-7 w-64 rounded-lg bg-app-input" />
                <div className="h-4 w-48 rounded bg-app-input" />
              </div>
              <div className="flex gap-2">
                <div className="h-10 w-28 rounded-xl bg-app-input" />
                <div className="h-10 w-28 rounded-xl bg-app-input" />
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Court Layout Skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Court Grid */}
          <div className="space-y-4 lg:col-span-8">
            <div className="h-12 rounded-xl border border-app-border bg-app-card animate-pulse" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-64 rounded-2xl border border-app-border bg-app-card p-5 animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* Right: Player Priority & History Skeleton */}
          <div className="space-y-4 lg:col-span-4">
            <div className="h-72 rounded-2xl border border-app-border bg-app-card p-5 animate-pulse" />
            <div className="h-56 rounded-2xl border border-app-border bg-app-card p-5 animate-pulse" />
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-app-border/40 py-6 text-center text-xs text-app-text-muted">
        <div className="h-4 w-36 mx-auto rounded bg-app-card animate-pulse" />
      </footer>
    </div>
  );
}
