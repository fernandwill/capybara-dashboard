import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/apiAuth';
import { determineMatchStatus } from '@/utils/matchStatusUtils';
import { validate, validationErrorResponse, schemas } from '@/lib/validation';
import { handleApiError, ApiErrors } from '@/lib/apiError';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const matches = await prisma.match.findMany({
      include: {
        players: {
          include: {
            player: true,
          },
        },
        payments: true,
      },
      orderBy: {
        date: "asc",
      },
    });
    return NextResponse.json(matches);
  } catch (error) {
    return handleApiError(error, ApiErrors.serverError('fetch matches'));
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();

    // Validate input
    const validation = validate(body, schemas.createMatch);
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    const {
      title,
      location,
      courtNumber,
      date,
      time,
      fee,
      status = "UPCOMING",
      description,
    } = body;

    // Use shared utility to determine correct status
    const finalStatus = determineMatchStatus(date, time, status);

    const match = await prisma.match.create({
      data: {
        title: title.trim(),
        location: location.trim(),
        courtNumber: courtNumber?.trim() || null,
        date: new Date(date),
        time,
        fee,
        status: finalStatus,
        description: description?.trim() || null,
      },
      include: {
        players: {
          include: {
            player: true,
          },
        },
        payments: true,
      },
    });

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    return handleApiError(error, ApiErrors.serverError('create match'));
  }
}
