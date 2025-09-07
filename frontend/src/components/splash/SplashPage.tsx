"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import "./splash.css";

interface SplashPageProps {
  onDismiss: () => void;
}

export default function SplashPage({ onDismiss }: SplashPageProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isDismissing, setIsDismissing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const minSwipeDistance = 50;

  useEffect(() => {
    const checkIsMobile = () => {
      if (typeof window === "undefined") return;

      const userAgent =
        navigator.userAgent ||
        navigator.vendor ||
        (window as unknown as Window & { opera?: string }).opera ||
        "";

      // More accurate mobile detection
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          userAgent
        );
      
      // Check for touch capability AND small screen size
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;
      
      // Additional check for screen size (typical mobile screens are smaller)
      const isSmallScreen = window.innerWidth <= 768;
      
      // Consider it mobile only if it's detected as mobile device OR
      // it has touch capability AND is a small screen
      // This prevents desktop touchscreens from being classified as mobile
      setIsMobile(isMobileDevice || (isTouchDevice && isSmallScreen));
    };

    checkIsMobile();

    // Prevent default touch behaviors on the body when splash is active
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";

      return () => {
        if (typeof document !== "undefined") {
          document.body.style.overflow = "";
          document.body.style.touchAction = "";
        }
      };
    }
  }, []);

  // Handle touch start
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  // Handle touch move
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const currentTouch = e.targetTouches[0].clientY;
    const distance = touchStart - currentTouch;

    // Provide immediate visual feedback for upward swipes
    if (distance > 20) {
      // Removed style manipulation to avoid TypeScript errors
    }
  };

  // Handle touch end
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touchEnd = e.changedTouches[0].clientY;
    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > minSwipeDistance;

    if (isUpSwipe) {
      handleDismiss();
    }

    setTouchStart(null);
  };

  // Handle dismiss with animation
  const handleDismiss = () => {
    setIsDismissing(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  // Handle click/tap for non-touch devices or as fallback
  const handleClick = () => {
    // Only handle click if it's not a touch device or if touch events failed
    if (!isMobile) {
      handleDismiss();
    }
  };

  return (
    <div
      className={`splash-container ${isDismissing ? "dismiss" : ""}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={handleClick}
    >
      <div className="logo-container">
        <Image
          src="/icons/icon.jpg"
          alt="Capybara Logo"
          width={120}
          height={120}
          className="splash-logo"
        />
      </div>
      <h1 className="app-title">Capybara&apos;s Dashboard</h1>
      <div className="swipe-instruction">
        <span>{isMobile ? "Swipe up to continue" : "Click to continue"}</span>
        {isMobile && (
          <div className="swipe-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="swipe-arrow"
            >
              <path
                d="M7 14L12 9L17 14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7 18L12 13L17 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.6"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
