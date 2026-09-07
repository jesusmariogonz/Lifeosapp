import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toDateOnly } from "@/lib/utils";
import DashboardClient from "@/components/dashboard/DashboardClient";

// V2: cross-area analytics hook (dashboard is where cross-module rollups will surface)
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as any).id as string;

  const today = toDateOnly(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const [user, events, tasks, habits, habitLogsToday, yesterdayWellness, todayJournal] =
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
    ]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const hoursLeft = 24 - new Date().getHours();

  return (
    <DashboardClient
      userName={user?.name || user?.email || "there"}
      greeting={greeting}
      hoursLeft={hoursLeft}
      events={JSON.parse(JSON.stringify(events))}
      tasks={JSON.parse(JSON.stringify(tasks))}
      habits={JSON.parse(JSON.stringify(habits))}
      habitLogsToday={JSON.parse(JSON.stringify(habitLogsToday))}
      yesterdayWellness={JSON.parse(JSON.stringify(yesterdayWellness))}
      todayJournal={JSON.parse(JSON.stringify(todayJournal))}
    />
  );
}
