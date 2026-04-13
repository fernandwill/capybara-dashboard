import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/apiAuth';
import { updateMatchStatuses } from '@/utils/matchStatusUtils';

export async function POST() {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return auth.response;
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
