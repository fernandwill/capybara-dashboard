import { NextResponse } from 'next/server';
import prisma from '@/lib/database';

export async function GET() {
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
    console.error('Error fetching matches:', error);
    return NextResponse.json({ error: "Failed to find matches." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      location,
      courtNumber,
      date,
      time,
      fee = 0,
      status = "UPCOMING",
      description,
    } = body;

    const match = await prisma.match.create({
      data: {
        title,
        location,
        courtNumber,
        date: new Date(date),
        time,
        fee,
        status,
        description,
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
    console.error('Error creating match:', error);
    return NextResponse.json({ error: "Failed to create match." }, { status: 500 });
  }
}
