"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import "./splash.css";

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
      className={`splash-container ${isDismissing ? 'dismiss' : ''}`}
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
        <span>{isMobile ? 'Swipe up to continue' : 'Do the tap magic'}</span>
        {isMobile && <div className="swipe-icon">{'>'}</div>}
      </div>
    </div>
  );
}
