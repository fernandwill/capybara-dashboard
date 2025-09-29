import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { parseTimeRange } from '@/lib/time';

// Add interface for match type
interface MatchWithTime {
  time: string;
}

export async function GET() {
  try {
    const totalMatches = await prisma.match.count();
    
    const upcomingMatches = await prisma.match.count({
      where: { status: "UPCOMING" }
    });
    
    const completedMatches = await prisma.match.count({
      where: { status: "COMPLETED" }
    });

    // Calculate total hours for completed matches
    const completedMatchesWithTime = await prisma.match.findMany({
      where: { status: "COMPLETED" },
      select: { time: true }
    });

    let totalHours = 0;
    completedMatchesWithTime.forEach((match: MatchWithTime) => {
      if (!match.time) {
        return;
      }

      const parsed = parseTimeRange(match.time);
      if (!parsed) {
        return;
      }

      totalHours += parsed.durationMinutes / 60;
    });

    return NextResponse.json({
      totalMatches,
      upcomingMatches,
      completedMatches,
      hoursPlayed: totalHours.toFixed(1),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
