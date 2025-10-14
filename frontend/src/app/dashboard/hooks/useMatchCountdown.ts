"use client";

import { useEffect, useState } from "react";

import { Match } from "../types";
import { getCountdownLabel } from "../utils/matchUtils";

export const useMatchCountdown = (match: Match | null) => {
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (!match) {
      setCountdown("");
      return;
    }

    const updateCountdown = () => {
      const label = getCountdownLabel(match);
      setCountdown(label);
    };

    updateCountdown();
    const interval = window.setInterval(updateCountdown, 60 * 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [match]);

  return countdown;
};
