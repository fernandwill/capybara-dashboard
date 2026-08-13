import type { Player, PaymentStatus } from "@/types/types";

/** A player joined to the current match, enriched with per-match state. */
export interface PlayerInMatch extends Player {
  paymentStatus: PaymentStatus;
  playCount: number;
}

/** A finished round rendered in the Match History card. */
export interface FinishedGameHistory {
  id: string;
  courtName: string;
  teamANames: string[];
  teamBNames: string[];
  finishedAt: string;
}
