import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { requireAdminUser } from '@/lib/apiAuth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { id: matchId } = await params;
    const body = await request.json();
    const { playerId, playerIds } = body;

    // Accept a single playerId (legacy callers) or a playerIds array (roster save)
    const idsToAdd =
      Array.isArray(playerIds) && playerIds.length > 0
        ? playerIds
        : playerId
          ? [playerId]
          : [];

    if (idsToAdd.length === 0) {
      return NextResponse.json(
        { error: "playerId or playerIds is required." },
        { status: 400 }
      );
    }

    // Create the missing rows (playCount starts at 0). skipDuplicates makes
    // this idempotent for players already in the match.
    const result = await prisma.matchPlayer.createMany({
      data: idsToAdd.map((playerId) => ({ matchId, playerId })),
      skipDuplicates: true,
    });

    return NextResponse.json({ created: result.count }, { status: 201 });
  } catch (error) {
    console.error('Error adding player to match:', error);
    return NextResponse.json({ error: "Failed to add player to match." }, { status: 500 });
  }
}
