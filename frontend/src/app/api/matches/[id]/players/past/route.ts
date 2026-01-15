import { NextResponse } from "next/server";
import prisma from "@/lib/database";
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/apiAuth';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return unauthorizedResponse();
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
    });

    return NextResponse.json(
      players.map((player: {id: string; name: string; email: string | null; phone: string | null; status: string; createdAt: Date; updatedAt: Date}) => ({
        ...player,
        name: player.name.trim(),
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
