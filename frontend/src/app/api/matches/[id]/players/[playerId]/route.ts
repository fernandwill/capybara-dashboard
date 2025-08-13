import { NextResponse } from 'next/server';
import prisma from '@/lib/database';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  try {
    const { id: matchId, playerId } = await params;

    // Check if the player is actually in this match
    const existingMatchPlayer = await prisma.matchPlayer.findUnique({
      where: {
        matchId_playerId: {
          matchId,
          playerId,
        },
      },
    });

    if (!existingMatchPlayer) {
      return NextResponse.json(
        { error: "Player is not in this match." },
        { status: 404 }
      );
    }

    await prisma.matchPlayer.delete({
      where: {
        matchId_playerId: {
          matchId,
          playerId,
        },
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error removing player from match:', error);
    return NextResponse.json({ error: "Failed to remove player from match." }, { status: 500 });
  }
}