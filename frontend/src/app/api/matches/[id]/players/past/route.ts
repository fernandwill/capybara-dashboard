import { NextResponse } from "next/server";
import prisma from "@/lib/database";
import { requireAdminUser } from '@/lib/apiAuth';

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

    const matchExists = await prisma.match.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!matchExists) {
      return NextResponse.json({ error: "Match not found." }, { status: 404 });
    }

    const players = await prisma.player.findMany({
      orderBy: {
        name: "asc",
      },
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
    });

    return NextResponse.json(
      players.map(({ _count, ...player }) => ({
        ...player,
        name: player.name.trim(),
        playCount: _count.matchPlayers,
      })),
    );
  } catch (error) {
    console.error("Error fetching players from database:", error);
    return NextResponse.json(
      { error: "Failed to fetch players." },
      { status: 500 }
    );
  }
}
