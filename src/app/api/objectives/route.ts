import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const goal = await prisma.goal.findFirst({ where: { id: body.goalId, userId } });
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const objective = await prisma.objective.create({
    data: {
      goalId: goal.id,
      title: body.title,
      description: body.description || null,
    },
  });
  return NextResponse.json(objective, { status: 201 });
}
