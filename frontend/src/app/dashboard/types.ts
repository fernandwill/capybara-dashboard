export type SortOption = "date-earliest" | "date-latest" | "fee-low" | "fee-high";

export type PaymentStatus = "BELUM_SETOR" | "SUDAH_SETOR";

export interface Stats {
  totalMatches: number;
  upcomingMatches: number;
  completedMatches: number;
  hoursPlayed: string;
}

export interface MatchPlayer {
  player: {
    id: string;
    name: string;
    status: string;
  };
  paymentStatus: PaymentStatus;
}

export interface Match {
  id: string;
  title: string;
  location: string;
  courtNumber: string;
  date: string;
  time: string;
  fee: number;
  status: string;
  description?: string;
  createdAt: string;
  players?: MatchPlayer[];
}
