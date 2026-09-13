import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { getUserTimezone, toDateOnlyInTimeZone } from "@/lib/tz";

// Toggle a habit's completion for a given date
export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const habit = await prisma.habit.findFirst({ where: { id: body.habitId, userId } });
  if (!habit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const timezone = await getUserTimezone(userId);
  const date = toDateOnlyInTimeZone(body.date ? new Date(body.date) : new Date(), timezone);
  const existing = await prisma.habitLog.findUnique({
    where: { habitId_date: { habitId: habit.id, date } },
  });

  if (existing) {
    await prisma.habitLog.delete({ where: { id: existing.id } });
    return NextResponse.json({ completed: false });
  }
  const log = await prisma.habitLog.create({
    data: { habitId: habit.id, date, completed: true },
  });
  return NextResponse.json({ completed: true, log });
}
