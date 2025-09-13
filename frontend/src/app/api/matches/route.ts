import { NextResponse } from 'next/server';
import prisma from '@/lib/database';

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
      try {
        const now = new Date();
        const matchDate = new Date(date);
        
        // Parse the time string (e.g., "18:00-20:00")
        const timeParts = time.split('-');
        if (timeParts.length === 2) {
          const endTime = timeParts[1].trim(); // Get the end time
          const [endHour, endMin] = endTime.split(':').map(Number);
          
          // Create a date object for the match end time
          const matchEndDate = new Date(matchDate);
          matchEndDate.setHours(endHour, endMin, 0, 0);
          
          // If the match end time has passed, mark it as completed
          if (matchEndDate < now) {
            finalStatus = "COMPLETED";
          }
        }
      } catch (parseError) {
        console.warn('Error parsing time for status determination:', parseError);
        // Keep the original status if parsing fails
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
