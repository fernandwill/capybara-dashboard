import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/database';
import { requireAdminUser } from '@/lib/api-auth';
import { validate, validationErrorResponse, schemas } from '@/lib/validation';
import { handleApiError, ApiErrors } from '@/lib/api-error';
import { rateLimitGuard } from '@/lib/rate-limit';

export async function GET() {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    const players = await prisma.player.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        matchPlayers: {
          include: {
            match: {
              select: {
                id: true,
                date: true,
                status: true,
              },
            },
          },
        },
      },
    });

    const enriched = players.map((player) => {
      const allMatchPlayers = player.matchPlayers || [];
      const completedMatchPlayers = allMatchPlayers.filter(
        (mp) => mp.match?.status === "COMPLETED"
      );
      const thisYearMatches = completedMatchPlayers.filter((mp) => {
        const d = new Date(mp.match.date);
        return d >= startOfYear && d <= endOfYear;
      });

      // Find latest played date
      let lastPlayed: string | null = null;
      if (allMatchPlayers.length > 0) {
        const validDates = allMatchPlayers
          .map((mp) => new Date(mp.match?.date).getTime())
          .filter((t) => !isNaN(t))
          .sort((a, b) => b - a);

        if (validDates.length > 0) {
          lastPlayed = new Date(validDates[0]).toISOString();
        }
      }

      return {
        id: player.id,
        name: player.name,
        email: player.email,
        phone: player.phone,
        notes: player.notes,
        status: player.status,
        createdAt: player.createdAt,
        updatedAt: player.updatedAt,
        playCount: completedMatchPlayers.length,
        totalMatches: completedMatchPlayers.length,
        thisYearMatches: thisYearMatches.length,
        lastPlayed,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    return handleApiError(error, ApiErrors.serverError('fetch players'));
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth.response;
  }

  const rateLimited = rateLimitGuard(request);
  if (rateLimited) {
    return rateLimited;
  }

  try {
    const body = await request.json();

    // Validate input
    const validation = validate(body, schemas.createPlayer);
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    const { name, email, phone, notes, status = "ACTIVE" } = body;
    const trimmedName = name.trim();

    // Best-effort guard for a friendlier message. The authoritative guard is
    // the unique index on player.name (set up via migration) — a race between
    // two concurrent creates is caught below as P2002 instead of a 500.
    const existingPlayer = await prisma.player.findFirst({
      where: {
        name: trimmedName,
      },
    });

    if (existingPlayer) {
      return NextResponse.json({ error: "Player already exists." }, { status: 409 });
    }

    const player = await prisma.player.create({
      data: {
        name: trimmedName,
        email: email || null,
        phone: phone || null,
        notes: notes != null && notes.trim() ? notes.trim() : null,
        status,
      },
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    // Unique constraint on name (P2002) can be hit by a concurrent create that
    // slipped past the findFirst guard above.
    // Prisma surfaces unique-index violations as P2002 known request errors.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Player already exists." }, { status: 409 });
    }
    return handleApiError(error, ApiErrors.serverError('create player'));
  }
}
