import { NextResponse } from 'next/server';
import prisma from '@/lib/database';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        players: {
          include: {
            player: true,
          },
        },
        payments: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found." }, { status: 404 });
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error('Error fetching match:', error);
    return NextResponse.json({ error: "Failed to fetch match." }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      location,
      courtNumber,
      date,
      time,
      fee,
      status,
      description,
    } = body;

    // Determine the correct status based on date and time
    let finalStatus = status;
    if (status === "UPCOMING" && date && time) {
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

    const match = await prisma.match.update({
      where: { id },
      data: {
        title,
        location,
        courtNumber,
        date: date ? new Date(date) : undefined,
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

    // Auto-update match statuses
    await updateMatchStatuses();

    return NextResponse.json(match);
  } catch (error) {
    console.error('Error updating match:', error);
    return NextResponse.json({ error: "Failed to update match." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.match.delete({
      where: { id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting match:', error);
    return NextResponse.json({ error: "Failed to delete match." }, { status: 500 });
  }
}

// Auto-update function
async function updateMatchStatuses() {
  try {
    const now = new Date();
    let updatedCount = 0;
    
    const upcomingMatches = await prisma.match.findMany({
      where: { 
        status: 'UPCOMING',
        date: {
          lte: now // Only check matches that are today or in the past
        }
      },
      select: { 
        id: true, 
        date: true, 
        time: true,
        title: true // Include title for better logging
      }
    });
    
    for (const match of upcomingMatches) {
      try {
        // Parse the time string (e.g., "18:00-20:00")
        const timeParts = match.time.split('-');
        if (timeParts.length !== 2) {
          console.warn(`Invalid time format for match ${match.id}: ${match.time}`);
          continue;
        }
        
        const endTime = timeParts[1]; // Get the end time (e.g., "20:00")
        const [endHour, endMin] = endTime.split(':').map(Number);
        
        // Create a date object for the match end time
        const matchEndDate = new Date(match.date);
        matchEndDate.setHours(endHour, endMin, 0, 0);
        
        // If the match end time has passed, mark it as completed
        if (matchEndDate < now) {
          await prisma.match.update({
            where: { id: match.id },
            data: { status: 'COMPLETED' }
          });
          
          console.log(`Auto-completed match: ${match.title} (${match.id})`);
          updatedCount++;
        }
      } catch (parseError) {
        console.error(`Error parsing time for match ${match.id}:`, parseError);
        continue;
      }
    }
    
    return updatedCount;
  } catch (error) {
    console.error('Error updating match statuses:', error);
  }
}
