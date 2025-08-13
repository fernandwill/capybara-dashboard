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

    const match = await prisma.match.update({
      where: { id },
      data: {
        title,
        location,
        courtNumber,
        date: date ? new Date(date) : undefined,
        time,
        fee,
        status,
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
    
    const upcomingMatches = await prisma.match.findMany({
      where: { status: 'UPCOMING' },
      select: { id: true, date: true, time: true }
    });
    
    for (const match of upcomingMatches) {
      const matchDate = new Date(match.date);
      const [, endTime] = match.time.split('-');
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      matchDate.setHours(endHour, endMin, 0, 0);
      
      if (matchDate < now) {
        await prisma.match.update({
          where: { id: match.id },
          data: { status: 'COMPLETED' }
        });
      }
    }
  } catch (error) {
    console.error('Error updating match statuses:', error);
  }
}
