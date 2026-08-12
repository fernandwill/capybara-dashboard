// One-off diagnostic: run the exact rounds-transaction against the DB using the current generated client
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const match = await p.match.findFirst({ select: { id: true, title: true } });
  if (!match) {
    console.log("NO MATCH FOUND");
    return;
  }
  const matchPlayers = await p.matchPlayer.findMany({
    where: { matchId: match.id },
    take: 4,
    select: { playerId: true },
  });
  if (matchPlayers.length < 2) {
    console.log("not enough match players to simulate a round; ids:", matchPlayers.length);
  }
  const ids = matchPlayers.slice(0, 4).map((m) => m.playerId);
  const teamA = ids.slice(0, 2);
  const teamB = ids.slice(2, 4);

  console.log("target match:", match.id, match.title);
  console.log("simulating round teamA:", teamA, "teamB:", teamB);

  try {
    const { round, updated } = await p.$transaction(async (tx) => {
      const created = await tx.matchRound.create({
        data: {
          matchId: match.id,
          courtNumber: 1,
          teamAPlayerIds: teamA,
          teamBPlayerIds: teamB,
        },
      });
      const result = await tx.matchPlayer.updateMany({
        where: { matchId: match.id, playerId: { in: [...teamA, ...teamB] } },
        data: { playCount: { increment: 1 } },
      });
      return { round: created, updated: result.count };
    });
    console.log("TRANSACTION OK — round:", round.id, "| updated rows:", updated);
  } catch (e) {
    console.log("TRANSACTION FAILED:");
    console.log(e.message);
    if (e.meta) console.log("meta:", JSON.stringify(e.meta));
  }

  await p.$disconnect();
}

main().catch((e) => {
  console.error("SCRIPT ERROR:", e.message);
  process.exit(1);
});
