import prisma from './database';

type MatchSchedule = {
  id: string;
  date: Date;
  time: string;
};

const getMatchEndTime = (date: Date, timeRange: string) => {
  const [, endTime] = timeRange.split('-');
  const [endHour, endMin] = endTime.split(':').map(Number);

  const matchDate = new Date(date);
  matchDate.setHours(endHour, endMin, 0, 0);

  return matchDate;
};

export const updateMatchStatuses = async () => {
  const now = new Date();
  const upcomingMatches: MatchSchedule[] = await prisma.match.findMany({
    where: { status: 'UPCOMING' },
    select: { id: true, date: true, time: true },
  });

  const updates = upcomingMatches
    .filter((match) => getMatchEndTime(match.date, match.time) < now)
    .map(({ id }: MatchSchedule) =>
      prisma.match.update({
        where: { id },
        data: { status: 'COMPLETED' },
      }),
    );

  if (updates.length > 0) {
    await prisma.$transaction(updates);
  }

  return updates.length;
};
