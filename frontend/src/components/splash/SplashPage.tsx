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
  
  // Minimum swipe distance for gesture recognition
  const minSwipeDistance = 50;

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
        <p className="swipe-instruction">
          <span>Swipe up to continue</span>
          <svg 
            className="swipe-icon" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </p>
      </div>
    </div>
  );
}