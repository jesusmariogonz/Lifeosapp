import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const goals = await prisma.goal.findMany({
    where: { userId },
    include: { objectives: { include: { weeklyTargets: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(goals);
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const goal = await prisma.goal.create({
    data: {
      userId,
      title: body.title,
      description: body.description || null,
      vision: body.vision || null,
    },
  });
  return NextResponse.json(goal, { status: 201 });
}
