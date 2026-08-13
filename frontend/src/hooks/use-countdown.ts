// Custom hook for countdown timer to a match

import { useState, useEffect } from "react";
import { Match } from "@/types/types";
import { getMatchCountdown } from "@/utils/match-utils";

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
            const parts = getMatchCountdown(match);

            if (parts === null) {
                setCountdown("Time pending");
                return;
            }

            if (parts.started) {
                setCountdown("Match Started");
                return;
            }

            const { days, hours, minutes } = parts;
            if (days > 0) {
                setCountdown(`${days}d ${hours}h ${minutes}m`);
            } else if (hours > 0) {
                setCountdown(`${hours}h ${minutes}m`);
            } else if (minutes > 0) {
                setCountdown(`${minutes}m`);
            } else {
                setCountdown("Starting soon");
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 60000);

        return () => clearInterval(interval);
    }, [match]);

    return countdown;
}
