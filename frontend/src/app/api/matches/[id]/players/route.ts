import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/apiAuth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const { id: matchId } = await params;
    const body = await request.json();
    const { playerId } = body;

    // Check if player is already in this match
    const existingMatchPlayer = await prisma.matchPlayer.findUnique({
      where: {
        matchId_playerId: {
          matchId,
          playerId,
        },
      },
    });

    if (existingMatchPlayer) {
      return NextResponse.json(
        { error: "Player is already in this match." },
        { status: 400 }
      );
    }

    const matchPlayer = await prisma.matchPlayer.create({
      data: {
        matchId,
        playerId,
      },
      include: {
        player: true,
        match: true,
      },
    });

    return NextResponse.json(matchPlayer, { status: 201 });
  } catch (error) {
    console.error('Error adding player to match:', error);
    return NextResponse.json({ error: "Failed to add player to match." }, { status: 500 });
  }
}