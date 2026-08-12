/**
 * Shared Prisma include shape for match queries (players + payments).
 * Used by the frontend API routes so the include block lives in one place.
 */
export const MATCH_INCLUDE = {
  players: {
    include: {
      player: true,
    },
  },
  payments: true,
} as const;
