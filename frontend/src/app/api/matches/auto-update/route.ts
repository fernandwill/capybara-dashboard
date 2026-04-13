import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { updateMatchStatuses } from '@/utils/matchStatusUtils';

function authorizeCronRequest(request: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    logger.error("CRON_SECRET is not configured for match auto-update.");
    return NextResponse.json({ error: "Cron secret is not configured" }, { status: 500 });
  }

  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${cronSecret}`) {
    logger.warn("Rejected unauthorized match auto-update request.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export async function GET(request: NextRequest) {
  const authError = authorizeCronRequest(request);
  if (authError) {
    return authError;
  }

  try {
    const updatedCount = await updateMatchStatuses();
    return NextResponse.json({
      message: `Successfully updated ${updatedCount} matches`,
      updatedCount
    });
  } catch (error: unknown) {
    logger.error("Error in match auto-update cron.", error);
    return NextResponse.json({ error: "Failed to auto-update matches" }, { status: 500 });
  }
}
