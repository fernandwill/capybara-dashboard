import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/apiAuth';

// Add interface for match type
interface MatchWithTime {
  time: string;
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return unauthorizedResponse();
  }

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
      if (match.time && match.time.includes("-")) {
        const [startTime, endTime] = match.time.split("-");
        const [startHour, startMin] = startTime.split(":").map(Number);
        const [endHour, endMin] = endTime.split(":").map(Number);

        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        const durationMinutes = endMinutes - startMinutes;

        totalHours += durationMinutes / 60;
      }
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
