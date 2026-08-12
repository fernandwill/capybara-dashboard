import { NextResponse } from "next/server";
import prisma from "@/lib/database";
import { requireAdminUser } from "@/lib/apiAuth";
import { handleApiError, ApiErrors } from "@/lib/apiError";

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
    const { courtNumber, teamAPlayerIds, teamBPlayerIds } = body;

    if (!Array.isArray(teamAPlayerIds) || !Array.isArray(teamBPlayerIds)) {
      return NextResponse.json(
        { error: "teamAPlayerIds and teamBPlayerIds must be arrays." },
        { status: 400 }
      );
    }

    const allPlayedIds = [...new Set([...teamAPlayerIds, ...teamBPlayerIds])];
    if (allPlayedIds.length === 0) {
      return NextResponse.json(
        { error: "A finished round needs at least one player." },
        { status: 400 }
      );
    }

    // Persist the finished game AND increment per-match play counts atomically
    const { round, updated } = await prisma.$transaction(async (tx) => {
      const created = await tx.matchRound.create({
        data: {
          matchId,
          courtNumber: Number(courtNumber) || 1,
          teamAPlayerIds,
          teamBPlayerIds,
        },
      });

      const result = await tx.matchPlayer.updateMany({
        where: {
          matchId,
          playerId: { in: allPlayedIds },
        },
        data: {
          playCount: { increment: 1 },
        },
      });

      return { round: created, updated: result.count };
    });

    return NextResponse.json({ round, updated }, { status: 201 });
  } catch (error) {
    return handleApiError(error, ApiErrors.serverError("save round"));
  }
}
