import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { requireAdminUser } from '@/lib/apiAuth';
import { determineMatchStatus, updateMatchStatuses } from '@/utils/matchStatusUtils';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { id } = await params;
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        players: {
          include: {
            player: {
              include: {
                _count: {
                  select: {
                    matchPlayers: {
                      where: {
                        match: {
                          status: "COMPLETED",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        payments: true,
        rounds: {
          orderBy: {
            finishedAt: "desc",
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found." }, { status: 404 });
    }

    const matchWithPlayCounts = {
      ...match,
      players: match.players.map(({ player, ...matchPlayer }) => ({
        ...matchPlayer,
        player: {
          ...player,
          playCount: player._count?.matchPlayers ?? 0,
          _count: undefined,
        },
      })),
    };

    return NextResponse.json(matchWithPlayCounts);
  } catch (error) {
    console.error('Error fetching match:', error);
    return NextResponse.json({ error: "Failed to fetch match." }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth.response;
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

    // Preserve per-match round counts and payment status when the roster is
    // re-saved (the update below replaces match_players rows entirely)
    let existingRows: { playerId: string; playCount: number; paymentStatus: string }[] = [];
    if (Array.isArray(playerIds) && playerIds.length > 0) {
      existingRows = await prisma.matchPlayer.findMany({
        where: { matchId: id, playerId: { in: playerIds } },
        select: { playerId: true, playCount: true, paymentStatus: true },
      });
    }
    const existingByPlayer = new Map(
      existingRows.map((row) => [row.playerId, row])
    );

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
          create: playerIds.map((playerId: string) => {
            const existing = existingByPlayer.get(playerId);
            return {
              player: {
                connect: { id: playerId }
              },
              playCount: existing?.playCount ?? 0,
              paymentStatus: existing?.paymentStatus ?? "BELUM_SETOR",
            };
          })
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
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth.response;
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
