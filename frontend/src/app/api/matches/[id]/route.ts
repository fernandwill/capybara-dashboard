import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/apiAuth';
import { determineMatchStatus, updateMatchStatuses } from '@/utils/matchStatusUtils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

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
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

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
      playerIds,
    } = body;

    // Use shared utility to determine correct status
    const finalStatus = date && time && status
      ? determineMatchStatus(date, time, status)
      : status;

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
        players: playerIds ? {
          deleteMany: {},
          create: playerIds.map((playerId: string) => ({
            player: {
              connect: { id: playerId }
            }
          }))
        } : undefined
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

    // Auto-update other match statuses
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
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

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
