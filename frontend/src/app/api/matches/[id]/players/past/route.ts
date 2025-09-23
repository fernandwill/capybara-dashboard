import { NextResponse } from 'next/server';
import prisma from '@/lib/database';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const currentMatch = await prisma.match.findUnique({
      where: { id },
      select: {
        date: true,
      },
    });

    if (!currentMatch) {
      return NextResponse.json({ error: "Match not found." }, { status: 404 });
    }

    const pastMatches = await prisma.match.findMany({
      where: {
        date: {
          lt: currentMatch.date,
        },
        status: 'COMPLETED',
      },
      orderBy: {
        date: 'desc',
      },
      take: 3,
      include: {
        players: {
          include: {
            player: true,
          },
        },
      },
    });

    const playerMap = new Map<string, (typeof pastMatches)[number]['players'][number]['player']>();

    for (const match of pastMatches) {
      for (const matchPlayer of match.players) {
        const player = matchPlayer.player;
        if (!playerMap.has(player.id)) {
          playerMap.set(player.id, player);
        }
      }
    }

    return NextResponse.json(Array.from(playerMap.values()));
  } catch (error) {
    console.error('Error fetching players from past matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players from past matches.' },
      { status: 500 }
    );
  }
}
