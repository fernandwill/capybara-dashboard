// Custom hook for countdown timer to a match

import { useState, useEffect } from "react";
import { Match } from "@/types/types";

/**
 * Returns a countdown string like "2d 5h 30m" until the match starts.
 */
export function useCountdown(match: Match | null): string {
    const [countdown, setCountdown] = useState<string>("");

    useEffect(() => {
        if (!match) {
            setCountdown("");
            return;
        }

        const updateCountdown = () => {
            try {
                const matchDate = new Date(match.date);
                const timeString = match.time.split("-")[0].trim();
                const [hours, minutes] = timeString.split(":").map(Number);

                const matchDateTime = new Date(matchDate);
                matchDateTime.setHours(hours, minutes, 0, 0);

                const now = new Date();
                const timeDiff = matchDateTime.getTime() - now.getTime();

                if (timeDiff <= 0) {
                    setCountdown("Match Started");
                    return;
                }

                const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                const hoursLeft = Math.floor(
                    (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
                );
                const minutesLeft = Math.floor(
                    (timeDiff % (1000 * 60 * 60)) / (1000 * 60)
                );

                if (days > 0) {
                    setCountdown(`${days}d ${hoursLeft}h ${minutesLeft}m`);
                } else if (hoursLeft > 0) {
                    setCountdown(`${hoursLeft}h ${minutesLeft}m`);
                } else if (minutesLeft > 0) {
                    setCountdown(`${minutesLeft}m`);
                } else {
                    setCountdown("Starting soon");
                }
            } catch (error) {
                console.error("Error calculating countdown:", error);
                setCountdown("Time pending");
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 60000);

        return () => clearInterval(interval);
    }, [match]);

    return countdown;
}
