import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { requireAdminUser } from '@/lib/api-auth';
import { handleApiError, ApiErrors } from '@/lib/api-error';

interface StatsRow {
  total: number;
  upcoming: number;
  completed: number;
  hours: number;
}

export async function GET() {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    // One round-trip instead of four sequential queries:
    // counts per status + total hours computed in SQL.
    // NOTE: the time regex uses POSIX classes ([0-9], [[:space:]]) on purpose —
    // backslash classes (\d, \s) are fragile inside JS template literals.
    const rows = await prisma.$queryRaw<StatsRow[]>`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'UPCOMING')::int AS upcoming,
        COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS completed,
        COALESCE(
          SUM(
            CASE
              WHEN status = 'COMPLETED'
                AND time ~ '^[0-9]{2}:[0-9]{2}[[:space:]]*-[[:space:]]*[0-9]{2}:[0-9]{2}$'
              THEN EXTRACT(EPOCH FROM (
                trim(split_part(time, '-', 2))::time - trim(split_part(time, '-', 1))::time
              )) / 3600.0
              ELSE 0
            END
          ),
          0
        )::float8 AS hours
      FROM matches
    `;

    const row = rows[0] ?? { total: 0, upcoming: 0, completed: 0, hours: 0 };

    return NextResponse.json({
      totalMatches: row.total,
      upcomingMatches: row.upcoming,
      completedMatches: row.completed,
      hoursPlayed: row.hours.toFixed(1),
    });
  } catch (error) {
    return handleApiError(error, ApiErrors.serverError('fetch stats'));
  }
}
