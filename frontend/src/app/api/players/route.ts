import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { requireAdminUser } from '@/lib/apiAuth';
import { validate, validationErrorResponse, schemas } from '@/lib/validation';
import { handleApiError, ApiErrors } from '@/lib/apiError';

export async function GET() {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth.response;
  }

  try {
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
        playCount: _count.matchPlayers,
      }))
    );
  } catch (error) {
    return handleApiError(error, ApiErrors.serverError('fetch players'));
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = await request.json();

    // Validate input
    const validation = validate(body, schemas.createPlayer);
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    const { name, email, phone, status = "ACTIVE" } = body;
    const trimmedName = name.trim();

    // Check for existing player
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
        status,
      },
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    return handleApiError(error, ApiErrors.serverError('create player'));
  }
}
