import { NextResponse } from 'next/server';
import prisma from '@/lib/database';
import { getMatchEndDate } from '@/lib/time';

export async function POST() {
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

// Make this function a regular async function so it's not treated as a route handler
async function updateMatchStatuses() {
  try {
    const now = new Date();
    let updatedCount = 0;
    
    const upcomingMatches = await prisma.match.findMany({
      where: { 
        status: 'UPCOMING',
        date: {
          lte: now // Only check matches that are today or in the past
        }
      },
      select: { 
        id: true, 
        date: true, 
        time: true,
        title: true // Include title for better logging
      }
    });
    
    console.log(`Checking ${upcomingMatches.length} upcoming matches for auto-completion`);
    
    for (const match of upcomingMatches) {
      try {
        const matchEndDate = getMatchEndDate(new Date(match.date), match.time);
        if (!matchEndDate) {
          console.warn(`Invalid time format for match ${match.id}: ${match.time}`);
          continue;
        }

        // If the match end time has passed, mark it as completed
        if (matchEndDate < now) {
          await prisma.match.update({
            where: { id: match.id },
            data: { status: 'COMPLETED' }
          });
          
          console.log(`Auto-completed match: ${match.title} (${match.id})`);
          updatedCount++;
        }
      } catch (parseError: unknown) {
        console.error(`Error parsing time for match ${match.id}:`, parseError);
        continue;
      }
    }
    
    return updatedCount;
  } catch (error: unknown) {
    console.error('Error updating match statuses:', error);
    throw error;
  }
}