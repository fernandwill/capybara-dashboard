import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { requireAdminUser } from '@/lib/apiAuth';
import { determineMatchStatus, updateMatchStatuses } from '@/utils/matchStatusUtils';
import { handleApiError, ApiErrors } from '@/lib/apiError';
import { MATCH_INCLUDE } from '@/lib/prismaIncludes';
import { rateLimitGuard } from '@/lib/rateLimit';

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
        ...MATCH_INCLUDE,
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
          playCount: matchPlayer.playCount ?? 0,
        },
      })),
    };

    return NextResponse.json(matchWithPlayCounts);
  } catch (error) {
    return handleApiError(error, ApiErrors.serverError('fetch match'));
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

  const rateLimited = rateLimitGuard(request);
  if (rateLimited) {
    return rateLimited;
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
    // re-saved. The read + replace (deleteMany/create) run in one transaction
    // so two concurrent roster saves can't overwrite each other's play counts.
    const match = await prisma.$transaction(async (tx) => {
      let existingRows: { playerId: string; playCount: number; paymentStatus: string }[] = [];
      if (Array.isArray(playerIds) && playerIds.length > 0) {
        existingRows = await tx.matchPlayer.findMany({
          where: { matchId: id, playerId: { in: playerIds } },
          select: { playerId: true, playCount: true, paymentStatus: true },
        });
      }
      const existingByPlayer = new Map(
        existingRows.map((row) => [row.playerId, row])
      );

      return tx.match.update({
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
        include: MATCH_INCLUDE,
      });
    });

    // Auto-update other match statuses
    await updateMatchStatuses();

    return NextResponse.json(match);
  } catch (error) {
    return handleApiError(error, ApiErrors.serverError('update match'));
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth.response;
  }

  const rateLimited = rateLimitGuard(request);
  if (rateLimited) {
    return rateLimited;
  }

  try {
    const { id } = await params;

    // payments.matchId has no cascade, so clear them explicitly before the
    // match delete. Wrapped in a transaction so a failure can't leave the
    // match alive with its payments already gone (or vice versa).
    await prisma.$transaction([
      prisma.payment.deleteMany({ where: { matchId: id } }),
      prisma.match.delete({ where: { id } }),
    ]);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, ApiErrors.serverError('delete match'));
  }
}
