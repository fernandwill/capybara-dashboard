import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/apiAuth';

// Add interface for match type
interface MatchData {
  date: Date;
  time: string;
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const matches = await prisma.match.findMany({
      where: { status: 'COMPLETED' },
      select: {
        date: true,
        time: true,
      }
    });

    const monthlyData = matches.reduce((acc: Record<string, {count: number, totalHours: number}>, match: MatchData) => {
      const date = new Date(match.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!acc[monthKey]) {
        acc[monthKey] = { count: 0, totalHours: 0 };
      }

      acc[monthKey].count += 1;
      const [startTime, endTime] = match.time.split('-');
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const durationHours = (endMinutes - startMinutes) / 60;

      acc[monthKey].totalHours += durationHours;

      return acc;
    }, {});

    return NextResponse.json(monthlyData);
  } catch (error) {
    console.error('Error fetching monthly stats:', error);
    return NextResponse.json({ error: 'Failed to fetch monthly stats' }, { status: 500 });
  }
}
