import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { requireAdminUser } from '@/lib/apiAuth';
import { handleApiError, ApiErrors } from '@/lib/apiError';
import { PaymentStatus } from "@/types/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { id: matchId, playerId } = await params;
    const body = await request.json();
    const { paymentStatus } = body as { paymentStatus?: PaymentStatus };

    const validStatuses: PaymentStatus[] = ["BELUM_SETOR", "SUDAH_SETOR"];

    if (!paymentStatus || !validStatuses.includes(paymentStatus)) {
      return NextResponse.json(
        { error: "A valid payment status is required." },
        { status: 400 }
      );
    }

    const matchPlayer = await prisma.matchPlayer.update({
      where: {
        matchId_playerId: {
          matchId,
          playerId,
        },
      },
      data: {
        paymentStatus,
      },
    });

    return NextResponse.json(matchPlayer);
  } catch (error) {
    return handleApiError(error, ApiErrors.serverError("update payment status"));
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth.response;
  }

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
    return handleApiError(error, ApiErrors.serverError("remove player from match"));
  }
}
