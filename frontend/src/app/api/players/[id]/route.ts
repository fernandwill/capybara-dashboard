import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/database';
import { requireAdminUser } from '@/lib/api-auth';
import { validate, validationErrorResponse, schemas } from '@/lib/validation';
import { handleApiError, ApiErrors } from '@/lib/api-error';
import { rateLimitGuard } from '@/lib/rate-limit';

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
    const player = await prisma.player.findUnique({
      where: { id },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found." }, { status: 404 });
    }

    return NextResponse.json(player);
  } catch (error) {
    return handleApiError(error, ApiErrors.serverError('fetch player'));
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

    // Validate input (partial update — every field optional, still type-checked)
    const validation = validate(body, schemas.updatePlayer);
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    const { name, email, phone, notes, status } = body;

    // Reject renaming to a name already used by another player
    // Schema validation above guarantees name is a string or absent.
    if (name != null && name.trim()) {
      const existingPlayer = await prisma.player.findFirst({
        where: {
          name: name.trim(),
          NOT: { id },
        },
      });

      if (existingPlayer) {
        return NextResponse.json({ error: "Player already exists." }, { status: 409 });
      }
    }

    const data: Prisma.PlayerUpdateInput = {};
    if (name !== undefined) data.name = name.trim();
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (notes != null) {
      // Schema validation above guarantees notes is a string or absent.
      data.notes = notes.trim() ? notes.trim() : null;
    }
    if (status !== undefined) data.status = status;

    const player = await prisma.player.update({
      where: { id },
      data,
    });

    return NextResponse.json(player);
  } catch (error) {
    return handleApiError(error, ApiErrors.serverError('update player'));
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

    // Deleting a player cascades to their payment history and match
    // participation — refuse when any exist so records are never silently
    // destroyed.
    const [paymentCount, participationCount] = await Promise.all([
      prisma.payment.count({ where: { playerId: id } }),
      prisma.matchPlayer.count({ where: { playerId: id } }),
    ]);

    if (paymentCount > 0 || participationCount > 0) {
      const reason =
        paymentCount > 0
          ? "payment records"
          : "match history";
      return NextResponse.json(
        { error: `This player has ${reason} and cannot be deleted.` },
        { status: 409 }
      );
    }

    await prisma.player.delete({
      where: { id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, ApiErrors.serverError('delete player'));
  }
}
