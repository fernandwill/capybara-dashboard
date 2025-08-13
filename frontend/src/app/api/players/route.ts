import { NextResponse } from 'next/server';
import prisma from '@/lib/database';

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      orderBy: {
        name: "asc",
      },
    });
    return NextResponse.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json({ error: "Failed to find players." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, status = "ACTIVE", paymentStatus = "BELUM_SETOR" } = body;

    const player = await prisma.player.create({
      data: {
        name,
        email,
        phone,
        status,
        paymentStatus,
      },
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error('Error creating player:', error);
    return NextResponse.json({ error: "Failed to create player." }, { status: 500 });
  }
}