"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface SplashPageProps {
  onDismiss: () => void;
}

export default function SplashPage({ onDismiss }: SplashPageProps) {
  // Touch handling state
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDismissing, setIsDismissing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Minimum swipe distance for gesture recognition
  const minSwipeDistance = 50;

  // Detect if user is on mobile device
  useEffect(() => {
    const checkIsMobile = () => {
      const userAgent =
        typeof window !== "undefined" ? navigator.userAgent : "";
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          userAgent
        );
      setIsMobile(isMobile);
    };

    checkIsMobile();
  }, []);

  // Handle touch start
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientY);
  };

  // Handle touch move
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  // Handle touch end
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > minSwipeDistance;

    if (isUpSwipe) {
      setIsDismissing(true);
      setTimeout(() => {
        onDismiss();
      }, 300); // Match the CSS animation duration
    }
  };

  // Handle click/tap for non-touch devices
  const handleClick = () => {
    setIsDismissing(true);
    setTimeout(() => {
      onDismiss();
    }, 300); // Match the CSS animation duration
  };

  return (
    <div
      className={`splash-container ${isDismissing ? "dismiss" : ""}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={handleClick}
    >
      <div className="splash-content">
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
          <div className="swipe-icon">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="swipe-arrow"
            >
              <path
                d="M7 14L12 9L17 14"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7 18L12 13L17 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.5"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
