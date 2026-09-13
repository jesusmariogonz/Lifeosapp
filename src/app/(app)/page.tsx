import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserTimezone, localDayRangeUtc } from "@/lib/tz";
import DashboardClient from "@/components/dashboard/DashboardClient";

// V2: cross-area analytics hook (dashboard is where cross-module rollups will surface)
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as any).id as string;

  const timezone = await getUserTimezone(userId);
  // "Today" is computed in the user's own timezone, not server (UTC) time —
  // e.g. 11pm local in America/Mexico_City is already the next UTC day, but
  // must still resolve to today's local calendar date for this user's queries.
  const { start: today, end: tomorrow } = localDayRangeUtc(timezone);
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  const [user, events, tasks, habits, habitLogsToday, yesterdayWellness, todayJournal, contacts] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.event.findMany({
        where: { userId, startsAt: { gte: today }, endsAt: { lte: new Date(today.getTime() + 7 * 86400000) } },
        orderBy: { startsAt: "asc" },
        take: 6,
      }),
      prisma.task.findMany({
        where: { userId, completed: false },
        orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
        take: 8,
      }),
      prisma.habit.findMany({ where: { userId } }),
      prisma.habitLog.findMany({ where: { habit: { userId }, date: today } }),
      prisma.wellnessLog.findUnique({ where: { userId_date: { userId, date: yesterday } } }),
      prisma.journalEntry.findUnique({ where: { userId_date: { userId, date: today } } }),
      // V4: Relationships feed — important dates surface on the dashboard as upcoming events
      prisma.contact.findMany({ where: { userId }, include: { importantDates: true } }),
    ]);

  const upcomingDates = contacts
    .flatMap((c) => c.importantDates.map((d) => ({ label: d.label, contactName: c.name, date: d.date })))
    .map((d) => {
      const orig = new Date(d.date);
      const next = new Date(today.getFullYear(), orig.getMonth(), orig.getDate());
      if (next < today) next.setFullYear(next.getFullYear() + 1);
      return { ...d, next };
    })
    .filter((d) => d.next.getTime() - today.getTime() <= 30 * 86400000)
    .sort((a, b) => a.next.getTime() - b.next.getTime())
    .slice(0, 4);

  return (
    <DashboardClient
      userName={user?.name || user?.email || "there"}
      events={JSON.parse(JSON.stringify(events))}
      tasks={JSON.parse(JSON.stringify(tasks))}
      habits={JSON.parse(JSON.stringify(habits))}
      habitLogsToday={JSON.parse(JSON.stringify(habitLogsToday))}
      yesterdayWellness={JSON.parse(JSON.stringify(yesterdayWellness))}
      todayJournal={JSON.parse(JSON.stringify(todayJournal))}
      upcomingDates={JSON.parse(JSON.stringify(upcomingDates))}
    />
  );
}
