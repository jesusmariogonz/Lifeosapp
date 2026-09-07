import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { toDateOnly } from "@/lib/utils";

// V2: cross-area analytics hook (wellness feeds dashboard + weekly review rollups)
export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const logs = await prisma.wellnessLog.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 90,
  });
  return NextResponse.json(logs);
}

// V4: wearable/health integration hook (upsert would accept device-synced data here)
export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const date = toDateOnly(body.date ? new Date(body.date) : new Date());
  const log = await prisma.wellnessLog.upsert({
    where: { userId_date: { userId, date } },
    update: {
      sleepHours: body.sleepHours ?? undefined,
      weight: body.weight ?? undefined,
      steps: body.steps ?? undefined,
      exerciseMinutes: body.exerciseMinutes ?? undefined,
      waterOz: body.waterOz ?? undefined,
      energy: body.energy ?? undefined,
      stress: body.stress ?? undefined,
    },
    create: {
      userId,
      date,
      sleepHours: body.sleepHours ?? null,
      weight: body.weight ?? null,
      steps: body.steps ?? null,
      exerciseMinutes: body.exerciseMinutes ?? null,
      waterOz: body.waterOz ?? null,
      energy: body.energy ?? null,
      stress: body.stress ?? null,
    },
  });
  return NextResponse.json(log, { status: 201 });
}
