import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { getTimeRangeEnd } from '@/lib/time';

export async function GET() {
  try {
    const matches = await prisma.match.findMany({
      include: {
        players: {
          include: {
            player: true,
          },
        },
        payments: true,
      },
      orderBy: {
        date: "asc",
      },
    });
    return NextResponse.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json({ error: "Failed to find matches." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      location,
      courtNumber,
      date,
      time,
      fee = 0,
      status = "UPCOMING",
      description,
    } = body;

    // Determine the correct status based on date and time
    let finalStatus = status;
    if (status === "UPCOMING") {
      const now = new Date();
      const matchDate = new Date(date);
      const endTime = getTimeRangeEnd(time);

      if (endTime) {
        const matchEndDate = new Date(matchDate);
        matchEndDate.setHours(endTime.hours, endTime.minutes, 0, 0);

        if (matchEndDate < now) {
          finalStatus = "COMPLETED";
        }
      }
    }

    const match = await prisma.match.create({
      data: {
        title,
        location,
        courtNumber,
        date: new Date(date),
        time,
        fee,
        status: finalStatus,
        description,
      },
      include: {
        players: {
          include: {
            player: true,
          },
        },
        payments: true,
      },
    });

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    console.error('Error creating match:', error);
    return NextResponse.json({ error: "Failed to create match." }, { status: 500 });
  }
}
