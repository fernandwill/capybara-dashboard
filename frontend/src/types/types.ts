// Shared type definitions for the Capybara Dashboard

export type SortOption = "date-earliest" | "date-latest" | "fee-low" | "fee-high";

export type PaymentStatus = "BELUM_SETOR" | "SUDAH_SETOR";

export interface Stats {
    totalMatches: number;
    upcomingMatches: number;
    completedMatches: number;
    hoursPlayed: string;
}

export interface Player {
    id: string;
    name: string;
    status: string;
}

export interface MatchPlayer {
    player: Player;
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

export interface ModalState {
    isOpen: boolean;
    title: string;
    message: string;
}
