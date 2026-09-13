import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { getUserTimezone, startOfWeekMondayInTimeZone } from "@/lib/tz";

// V3: AI planning assistant hook (weekly review is the natural input for an AI planner)
export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const reviews = await prisma.weeklyReview.findMany({
    where: { userId },
    orderBy: { weekStart: "desc" },
  });
  return NextResponse.json(reviews);
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const timezone = await getUserTimezone(userId);
  const weekStart = startOfWeekMondayInTimeZone(body.weekStart ? new Date(body.weekStart) : new Date(), timezone);

  const review = await prisma.weeklyReview.upsert({
    where: { userId_weekStart: { userId, weekStart } },
    update: {
      tasksCompleted: body.tasksCompleted ?? undefined,
      habitsPercent: body.habitsPercent ?? undefined,
      financeSummary: body.financeSummary ?? undefined,
      wellnessSummary: body.wellnessSummary ?? undefined,
      goalsProgress: body.goalsProgress ?? undefined,
      wentWell: body.wentWell ?? undefined,
      improve: body.improve ?? undefined,
      nextPriority: body.nextPriority ?? undefined,
    },
    create: {
      userId,
      weekStart,
      tasksCompleted: body.tasksCompleted ?? 0,
      habitsPercent: body.habitsPercent ?? 0,
      financeSummary: body.financeSummary ?? undefined,
      wellnessSummary: body.wellnessSummary ?? undefined,
      goalsProgress: body.goalsProgress ?? undefined,
      wentWell: body.wentWell || null,
      improve: body.improve || null,
      nextPriority: body.nextPriority || null,
    },
  });
  return NextResponse.json(review, { status: 201 });
}
