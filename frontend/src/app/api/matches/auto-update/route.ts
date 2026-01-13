import { NextResponse } from 'next/server';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/apiAuth';
import { updateMatchStatuses } from '@/utils/matchStatusUtils';

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const updatedCount = await updateMatchStatuses();
    return NextResponse.json({
      message: `Successfully updated ${updatedCount} matches`,
      updatedCount
    });
  } catch (error: unknown) {
    console.error('Error in auto-update:', error);
    return NextResponse.json({ error: "Failed to auto-update matches" }, { status: 500 });
  }
}