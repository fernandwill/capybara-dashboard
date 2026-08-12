import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { requireAdminUser } from '@/lib/apiAuth';

interface MonthlyRow {
  month: string;
  count: number;
  totalHours: number;
}

export async function GET() {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    // Single round-trip: group completed matches by month and sum hours in SQL
    // instead of transferring every completed match to JS.
    // NOTE: the time regex uses POSIX classes ([0-9], [[:space:]]) on purpose —
    // backslash classes (\d, \s) are fragile inside JS template literals.
    // Month bucketing uses the DB session timezone (UTC in production).
    const rows = await prisma.$queryRaw<MonthlyRow[]>`
      SELECT
        to_char(date, 'YYYY-MM') AS month,
        COUNT(*)::int AS count,
        COALESCE(
          SUM(
            CASE
              WHEN time ~ '^[0-9]{2}:[0-9]{2}[[:space:]]*-[[:space:]]*[0-9]{2}:[0-9]{2}$'
              THEN EXTRACT(EPOCH FROM (
                trim(split_part(time, '-', 2))::time - trim(split_part(time, '-', 1))::time
              )) / 3600.0
              ELSE 0
            END
          ),
          0
        )::float8 AS "totalHours"
      FROM matches
      WHERE status = 'COMPLETED'
      GROUP BY month
      ORDER BY month
    `;

    const monthlyData = rows.reduce(
      (acc: Record<string, { count: number; totalHours: number }>, row) => {
        acc[row.month] = { count: row.count, totalHours: row.totalHours };
        return acc;
      },
      {}
    );

    return NextResponse.json(monthlyData);
  } catch (error) {
    console.error('Error fetching monthly stats:', error);
    return NextResponse.json({ error: 'Failed to fetch monthly stats' }, { status: 500 });
  }
}
