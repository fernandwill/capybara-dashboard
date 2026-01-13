import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/apiAuth';
import {PaymentStatus} from "@/types/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return unauthorizedResponse();
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
    console.error('Error updating match player payment status:', error);
    return NextResponse.json(
      { error: "Failed to update payment status." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return unauthorizedResponse();
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
    console.error('Error removing player from match:', error);
    return NextResponse.json({ error: "Failed to remove player from match." }, { status: 500 });
  }
}