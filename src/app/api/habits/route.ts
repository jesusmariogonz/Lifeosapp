import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const habits = await prisma.habit.findMany({
    where: { userId },
    include: { logs: { orderBy: { date: "desc" }, take: 60 } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(habits);
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const habit = await prisma.habit.create({
    data: {
      userId,
      name: body.name,
      frequency: body.frequency || "DAILY",
      targetPerWeek: body.targetPerWeek || null,
    },
  });
  return NextResponse.json(habit, { status: 201 });
}
