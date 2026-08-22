"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Top loading progress bar that provides instant visual feedback
 * when navigating between pages in the CapyHub App Router.
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  // Mirrors the in-flight navigation flag for the route-change effect so it
  // reads the latest value without re-running the moment a click starts
  // navigation (which would instantly jump the bar to 100%).
  const isNavigatingRef = useRef(false);

  // Complete and hide progress when route finishes changing
  useEffect(() => {
    if (isNavigatingRef.current) {
      setProgress(100);
      const timer = setTimeout(() => {
        isNavigatingRef.current = false;
        setVisible(false);
        setProgress(0);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept internal link clicks to start progress bar immediately (0ms feedback)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      const target = e.target.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("//") &&
        target.target !== "_blank" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey &&
        href !== pathname
      ) {
        isNavigatingRef.current = true;
        setVisible(true);
        setProgress(25);

        // Advance progress smoothly while waiting for page bundle
        const t1 = setTimeout(() => setProgress(65), 120);
        const t2 = setTimeout(() => setProgress(88), 320);

        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
        };
      }
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () =>
      document.removeEventListener("click", handleClick, { capture: true });
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none h-[2.5px] bg-transparent"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 shadow-[0_0_8px_rgba(234,179,8,0.6)] transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
