"use client";

import { useState } from "react";
import SplashPage from "../components/splash/SplashPage";
import { Dashboard } from "./Dashboard";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashDismiss = () => {
    setShowSplash(false);
  };

  return showSplash ? (
    <SplashPage onDismiss={handleSplashDismiss} />
  ) : (
    <Dashboard />
  );
}