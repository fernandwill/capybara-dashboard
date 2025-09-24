import { NextResponse } from "next/server";
import prisma from "@/lib/database";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const currentMatch = await prisma.match.findUnique({
      where: { id },
      select: { date: true },
    });

    if (!currentMatch) {
      return NextResponse.json({ error: "Match not found." }, { status: 404 });
    }

    const pastMatches = await prisma.match.findMany({
      where: {
        date: { lt: currentMatch.date },
        status: "COMPLETED",
      },
      orderBy: { date: "desc" },
      take: 3,
      include: {
        players: {
          include: {
            player: true, // must include updatedAt on the model for freshness to work
          },
        },
      },
    });

    type PlayerRecord = (typeof pastMatches)[number]["players"][number]["player"];
    const playerMap = new Map<string, PlayerRecord>();

    const normalizePlayerName = (name: string): string =>
      name.trim().toLowerCase(); // ✅ returns string

    const updatedAtOrEpoch = (p: PlayerRecord): number => {
      // if your Player model lacks updatedAt, change to createdAt or remove freshness logic
      const d = p?.updatedAt as Date | undefined;
      return d instanceof Date ? d.getTime() : 0;
    };

    for (const match of pastMatches) {
      for (const matchPlayer of match.players) {
        const player = {
          ...matchPlayer.player,
          name: matchPlayer.player.name.trim(),
        };
        const normalizedName = normalizePlayerName(player.name);

        const existingPlayer = playerMap.get(normalizedName);

        if (!existingPlayer || updatedAtOrEpoch(existingPlayer) < updatedAtOrEpoch(player)) {
          playerMap.set(normalizedName, player);
        }
      }
    }

    return NextResponse.json(Array.from(playerMap.values()));
  } catch (error) {
    console.error("Error fetching players from past matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch players from past matches." },
      { status: 500 }
    );
  }
}
